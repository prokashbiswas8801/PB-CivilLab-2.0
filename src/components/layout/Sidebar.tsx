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
import { EngineeringModuleId, UnitSystemPreset } from '../../types/civil';
import { useWorkbench } from '../../context/WorkbenchContext';
import { useTheme } from '../../context/ThemeContext';
import { useCivilLab } from '../../context/CivilLabContext';
import { TOOL_REGISTRY_MAP } from '../../data/toolRegistry';
import { BrandLogoIcon } from '../Logo';

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
  unitSystemPreset,
  onSelectUnitPreset,
  engineerDisplayName,
}) => {
  const workbench = useWorkbench();
  const civilLab = useCivilLab();
  const { theme, setTheme, availableThemes } = useTheme();

  const [filterQuery, setFilterQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    structural: true,
    geotechnical: false,
    estimation: false,
    hydraulics: false,
    sitemanagement: false,
    'testing-lab-qaqc': false,
  });

  // Compact Rail flyout state (when collapsed on desktop or on tablet rail)
  const [railFlyoutCatId, setRailFlyoutCatId] = useState<string | null>(null);
  const [railFlyoutTop, setRailFlyoutTop] = useState<number>(80);
  const [themePopoverOpen, setThemePopoverOpen] = useState(false);

  const tabletRailRef = useRef<HTMLDivElement>(null);
  const desktopRailRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Auto-expand the discipline group containing the active module
  useEffect(() => {
    if (isDashboardActive) return;
    const matchedCat = SIDEBAR_CATEGORIES.find((cat) =>
      cat.items.some((item) => item.moduleId === activeModule)
    );
    if (matchedCat) {
      setOpenCategories((prev) => (prev[matchedCat.id] ? prev : { ...prev, [matchedCat.id]: true }));
    }
  }, [activeModule, activeSubAction, isDashboardActive]);

  // Close rail flyout & theme popover on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (railFlyoutCatId) {
        const insideTablet = tabletRailRef.current?.contains(target) ?? false;
        const insideDesktop = desktopRailRef.current?.contains(target) ?? false;
        if (!insideTablet && !insideDesktop) {
          setRailFlyoutCatId(null);
        }
      }
      if (themePopoverOpen && themeMenuRef.current && !themeMenuRef.current.contains(target)) {
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
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
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
    onCloseMobile();
  };

  const isMetricActive = unitSystemPreset
    ? unitSystemPreset !== 'imperial'
    : workbench.unitSystem !== 'Imperial';

  const handleSetUnitSystem = (mode: 'metric' | 'imperial') => {
    if (onSelectUnitPreset) {
      onSelectUnitPreset(mode);
    } else {
      workbench.setUnitSystem(mode === 'imperial' ? 'Imperial' : 'SI');
    }
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
        className="relative flex flex-col h-full bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline-variant)] select-none"
      >
        {/* 1. TOP BRAND HEADER */}
        <div
          className={`h-16 flex items-center border-b border-[var(--md-sys-color-outline-variant)] shrink-0 ${
            railMode ? 'px-2 justify-center flex-col gap-1 py-2 h-auto min-h-[68px]' : 'px-3.5 justify-between gap-2'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              onSelectDashboard();
              onCloseMobile();
            }}
            aria-label="BD. CivilLab — Home"
            title="BD. CivilLab — Home"
            className={`flex items-center gap-2.5 cursor-pointer group transition-opacity text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] ${
              railMode ? 'p-1' : 'min-w-0 py-1 pr-1'
            }`}
          >
            <BrandLogoIcon size={railMode ? 30 : 32} animated={false} className="shadow-xs shrink-0" />
            {!railMode && (
              <div className="leading-tight min-w-0">
                <span className="text-sm font-black tracking-tight text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors block truncate">
                  <span className="text-[var(--md-sys-color-primary)]">BD.</span> CivilLab
                </span>
                <span className="block text-[10px] font-medium text-[var(--md-sys-color-on-surface-variant)] truncate">
                  Civil Workbench
                </span>
              </div>
            )}
          </button>

          {/* Collapse / Expand or Slide-Over Close Control */}
          {isSlideOver ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
              aria-label="Close navigation drawer"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <>
              {/* Desktop (lg+) 2-state Collapse / Expand toggle */}
              <button
                type="button"
                onClick={onToggleCollapse}
                className={`hidden lg:flex items-center justify-center rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer ${
                  railMode ? 'w-9 h-7' : 'w-9 h-9 shrink-0'
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
                  className="hidden md:flex lg:hidden items-center justify-center w-9 h-7 rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
                  title="Expand Navigation Drawer"
                  aria-label="Expand Navigation Drawer"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>

        {/* 2. DEDICATED "Home" ENTRY & QUICK FILTER SEARCH */}
        <div className={`${railMode ? 'px-2 pt-2.5 pb-2' : 'px-3 pt-3 pb-2 space-y-2.5'} shrink-0`}>
          <button
            type="button"
            onClick={() => {
              onSelectDashboard();
              setRailFlyoutCatId(null);
              onCloseMobile();
            }}
            aria-current={homeSelected ? 'page' : undefined}
            title="Home"
            className={`group relative w-full flex items-center transition-all cursor-pointer rounded-2xl min-h-[42px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] ${
              railMode ? 'justify-center px-0' : 'gap-3 px-3.5'
            } ${
              homeSelected
                ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-2xs'
                : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] font-semibold'
            }`}
          >
            <Home
              className={`w-[18px] h-[18px] shrink-0 transition-transform group-hover:scale-105 ${
                homeSelected
                  ? 'text-[var(--md-sys-color-on-primary-container)]'
                  : 'text-[var(--md-sys-color-primary)]'
              }`}
            />
            {!railMode && <span className="text-xs tracking-tight whitespace-nowrap">Home</span>}
          </button>

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
                className="w-full h-9 pl-8 pr-8 rounded-2xl text-xs bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/70 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-colors"
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

        {/* 3. SCROLLABLE M3 DISCIPLINE GROUPS / ICON RAIL */}
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar ${
            railMode ? 'px-2 py-1.5 space-y-2' : 'px-2.5 py-1.5 space-y-2'
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
                        setRailFlyoutCatId((prev) => (prev === cat.id ? null : cat.id));
                      }}
                      aria-expanded={isFlyoutOpen}
                      aria-label={cat.name}
                      title={cat.name}
                      className={`w-12 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] ${
                        hasActiveItem || isFlyoutOpen
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-xs'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          hasActiveItem || isFlyoutOpen
                            ? 'bg-transparent'
                            : `${accentStyle.iconBg} ${accentStyle.iconText}`
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                      </span>
                    </button>

                    {/* Hover Tooltip when flyout is closed */}
                    {!isFlyoutOpen && (
                      <div
                        role="tooltip"
                        className="pointer-events-none opacity-0 group-hover/rail:opacity-100 transition-opacity duration-150 fixed left-[84px] z-50 px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] shadow-xl whitespace-nowrap hidden md:block"
                        style={{ marginTop: '6px' }}
                      >
                        {cat.name} · {cat.items.length}
                      </div>
                    )}

                    {/* Floating M3 Popover Menu on Rail Click */}
                    {isFlyoutOpen && (
                      <div
                        style={{ top: `${railFlyoutTop}px` }}
                        className="fixed left-[84px] z-50 w-64 max-h-[70vh] overflow-y-auto custom-scrollbar rounded-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] shadow-2xl p-2 space-y-1"
                      >
                        <div className="px-2.5 py-2 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${accentStyle.iconBg} ${accentStyle.iconText}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] truncate">
                              {cat.name}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${accentStyle.badgeBg}`}
                          >
                            {cat.items.length}
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
                                className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-2xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                                  isItemActive
                                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                                }`}
                              >
                                <span className="text-xs truncate">{item.name}</span>
                                {item.badge && (
                                  <span className="text-[9.5px] font-mono font-semibold opacity-75 shrink-0">
                                    {item.badge}
                                  </span>
                                )}
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
            /* Expanded Mode: Pinned + Collapsible M3 Discipline Accordions */
            <>
              {/* Quick Pinned Calculators (only when not filtering) */}
              {!normalizedFilter && workbench.favoriteTools.length > 0 && (
                <div className="pb-1.5 border-b border-[var(--md-sys-color-outline-variant)]/70">
                  <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Pinned</span>
                    </span>
                    <span className="tabular-nums">{workbench.favoriteTools.length}</span>
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
                          className={`w-full min-h-[38px] flex items-center justify-between px-3 py-1 rounded-2xl text-xs transition-colors cursor-pointer select-none group/pinned ${
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
                  const isOpen = Boolean(normalizedFilter) || (openCategories[cat.id] ?? false);

                  return (
                    <div
                      key={cat.id}
                      className="rounded-2xl bg-[var(--md-sys-color-surface-container-low)]/50 border border-[var(--md-sys-color-outline-variant)]/60 overflow-hidden transition-colors"
                    >
                      {/* M3 Discipline Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        aria-expanded={isOpen}
                        className={`w-full px-2.5 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer text-left min-h-[42px] ${
                          hasActiveItem
                            ? accentStyle.activeHeader
                            : 'text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${accentStyle.iconBg} ${accentStyle.iconText}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-bold tracking-tight truncate">
                            {cat.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold tabular-nums ${accentStyle.badgeBg}`}
                          >
                            {cat.items.length}
                          </span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] transition-transform duration-200 ${
                              isOpen ? 'rotate-90' : ''
                            }`}
                          />
                        </div>
                      </button>

                      {/* Accordion Module Items */}
                      {isOpen && (
                        <div className="px-1.5 pb-1.5 pt-0.5 space-y-0.5">
                          {cat.items.map((item) => {
                            const isItemActive = checkItemActive(item);
                            const isFav = item.moduleId
                              ? workbench.isFavoriteTool(item.moduleId)
                              : false;

                            return (
                              <div
                                key={item.id}
                                className={`group/item relative flex items-center justify-between gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer ${
                                  isItemActive
                                    ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-2xs'
                                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] font-medium'
                                }`}
                                onClick={() => handleItemClick(item)}
                                title={item.name}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {/* Left subtle accent dot / highlight */}
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                                      isItemActive
                                        ? `${accentStyle.dotBg} scale-125`
                                        : 'bg-[var(--md-sys-color-outline)] group-hover/item:bg-[var(--md-sys-color-on-surface-variant)]'
                                    }`}
                                  />
                                  <div className="min-w-0 flex items-baseline gap-1.5 flex-1">
                                    <span className="text-xs truncate leading-snug">
                                      {item.name}
                                    </span>
                                    {item.bnLabel && (
                                      <span
                                        className="font-nikosh text-[10px] opacity-70 truncate shrink-0 max-w-[68px]"
                                        lang="bn"
                                      >
                                        {item.bnLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {item.badge && (
                                    <span
                                      className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                                        isItemActive
                                          ? 'bg-[var(--md-sys-color-on-primary-container)]/10 text-[var(--md-sys-color-on-primary-container)]'
                                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'
                                      }`}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.moduleId && !item.subAction && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        workbench.toggleFavoriteTool(item.moduleId!);
                                      }}
                                      className={`p-1 rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer ${
                                        isFav
                                          ? '!opacity-100 text-amber-500'
                                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-amber-500'
                                      }`}
                                      title={isFav ? 'Unpin' : 'Pin tool'}
                                      aria-label={isFav ? `Unpin ${item.name}` : `Pin ${item.name}`}
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
                })
              )}
            </>
          )}
        </div>

        {/* 4. COMPACT SIDEBAR UTILITY FOOTER DOCK */}
        <div
          ref={themeMenuRef}
          className={`relative border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] shrink-0 ${
            railMode ? 'p-2 flex flex-col items-center gap-1.5' : 'p-2.5 space-y-2'
          }`}
        >
          {/* Theme Popover Menu (Upward) */}
          {themePopoverOpen && (
            <div
              className={`absolute bottom-full mb-2 z-50 w-60 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1.5 space-y-1 ${
                railMode ? 'left-16' : 'left-2.5 right-2.5 w-auto'
              }`}
            >
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] border-b border-[var(--md-sys-color-outline-variant)]">
                Workbench Theme
              </div>
              {availableThemes.map((t) => {
                const isActive = t.id === theme;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      setThemePopoverOpen(false);
                    }}
                    className={`w-full px-2 py-1.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                        : 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: t.colors.accent }}
                      />
                      <span className="text-xs truncate">{t.name}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {railMode ? (
            /* Rail Mode Footer Icons */
            <>
              <button
                type="button"
                onClick={() => handleSetUnitSystem(isMetricActive ? 'imperial' : 'metric')}
                className="w-11 h-9 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[10px] font-mono font-bold text-[var(--md-sys-color-primary)] flex items-center justify-center transition-colors cursor-pointer"
                title={`Unit System: ${isMetricActive ? 'Metric SI' : 'Imperial ft-in'} (Click to switch)`}
                aria-label="Toggle Metric SI / Imperial unit system"
              >
                {isMetricActive ? 'SI' : 'ft-in'}
              </button>

              {onOpenCadModal && (
                <button
                  type="button"
                  onClick={() => onOpenCadModal('viewport')}
                  className="w-11 h-9 rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center transition-colors cursor-pointer"
                  title="CAD & Excel Hub"
                  aria-label="CAD & Excel Hub"
                >
                  <Laptop className="w-4 h-4" />
                </button>
              )}

              {onOpenArchitectureModal && (
                <button
                  type="button"
                  onClick={() => onOpenArchitectureModal('far')}
                  className="w-11 h-9 rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center transition-colors cursor-pointer"
                  title="Architecture By-Laws"
                  aria-label="Architecture By-Laws"
                >
                  <Compass className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setThemePopoverOpen((prev) => !prev)}
                className="w-11 h-9 rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-center transition-colors cursor-pointer"
                title="Theme"
                aria-label="Switch Theme"
              >
                <Palette className="w-4 h-4" />
              </button>

              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={() => onOpenProfileModal('profile')}
                  className="w-11 h-9 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)] flex items-center justify-center transition-colors cursor-pointer"
                  title={resolvedEngineerName}
                  aria-label={resolvedEngineerName}
                >
                  <User className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            /* Expanded Footer Dock */
            <>
              {/* 1-Click Unit System Toggle (Metric SI / Imperial ft-in) */}
              <div
                role="group"
                aria-label="Global Unit System"
                className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]"
              >
                <button
                  type="button"
                  onClick={() => handleSetUnitSystem('metric')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isMetricActive
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Metric SI
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUnitSystem('imperial')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                    !isMetricActive
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs'
                      : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                  }`}
                >
                  Imperial ft-in
                </button>
              </div>

              {/* Quick Modals Trigger Row: CAD & Excel Hub, Architecture By-Laws, Theme */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onOpenCadModal?.('viewport');
                    onCloseMobile();
                  }}
                  className="min-h-[36px] px-2 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50 hover:bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
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
                  className="min-h-[36px] px-2 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50 hover:bg-[var(--md-sys-color-surface-container)] text-[11px] font-semibold text-[var(--md-sys-color-on-surface)] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Architecture By-Laws"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">By-Laws</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemePopoverOpen((prev) => !prev)}
                  className={`min-h-[36px] px-2 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    themePopoverOpen
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border-[var(--md-sys-color-primary)]/50'
                      : 'bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/50 hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                  }`}
                  title="Switch Workbench Theme"
                >
                  <Palette className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                  <span className="truncate">Theme</span>
                </button>
              </div>

              {/* Engineer Profile Quick Trigger */}
              <button
                type="button"
                onClick={() => {
                  onOpenProfileModal?.('profile');
                  onCloseMobile();
                }}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)]/60 hover:bg-[var(--md-sys-color-surface-container)] flex items-center justify-between gap-2 transition-colors cursor-pointer text-left"
                title="Open Engineer Profile & Preferences"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] truncate">
                    {resolvedEngineerName}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
              </button>
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
        className="hidden md:block lg:hidden w-20 h-screen sticky top-0 shrink-0 z-30 print:hidden"
      >
        {renderSidebarBody({ railMode: true, containerRef: tabletRailRef })}
      </aside>

      {/* 2. Desktop Persistent 2-State Navigation Drawer / Icon Rail (lg and above) */}
      <aside
        aria-label="Primary Navigation Sidebar"
        className={`hidden lg:block h-screen sticky top-0 shrink-0 transition-all duration-300 z-30 print:hidden ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {renderSidebarBody({ railMode: isCollapsed, containerRef: desktopRailRef })}
      </aside>

      {/* 3. Mobile (<md) & Tablet Expanded Slide-Over M3 Modal Drawer */}
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
              className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 flex flex-col rounded-r-3xl overflow-hidden"
            >
              {renderSidebarBody({ railMode: false, isSlideOver: true })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
