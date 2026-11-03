import React from 'react';
import {
  SlidersHorizontal,
  HardHat,
  Boxes,
  Waves,
  Sparkles,
  Hammer,
  Grid,
  Shovel,
  ArrowRight,
  Pin,
  PinOff,
  Building,
  Scale,
  FolderArchive,
  ArrowRightLeft,
  BookOpen,
  Award,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  Calculator,
  Compass,
  FileSpreadsheet,
  Terminal,
  FileText,
  ClipboardCheck,
  Calendar,
  Users,
  Receipt,
  Wallet,
} from 'lucide-react';
import { EngineeringModuleId, CivilWorkspace } from '../../types/civil';
import { useCivilLab } from '../../context/CivilLabContext';
import { useWorkbench } from '../../context/WorkbenchContext';
import { TOOL_REGISTRY, ToolRegistryEntry } from '../../data/toolRegistry';
import { LogoMark } from '../Logo';

export interface HomePageProps {
  activeWorkspace: CivilWorkspace;
  workspaces: CivilWorkspace[];
  onSelectModule: (moduleId: EngineeringModuleId, subAction?: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenNewWorkspace: () => void;
  onOpenWorkspaceManager: () => void;
  onOpenProfileModal?: (tab?: 'profile' | 'preferences' | 'presets') => void;
  onOpenArchitectureModal?: (tab: 'far' | 'staircase' | 'watertank' | 'septictank') => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
  onOpenPrintPreview?: () => void;
  onDirectDownloadPdf?: () => void;
}

interface CategoryDefinition {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  tools: Array<{
    id: string;
    shortCode: string;
    title: string;
    description: string;
    standardUsed: string;
    icon: React.ComponentType<{ className?: string }>;
    moduleId?: EngineeringModuleId;
    modalType?: 'architecture' | 'cad' | 'site-qc';
    modalTab?: any;
    subAction?: string;
  }>;
}

export const HomePage: React.FC<HomePageProps> = ({
  activeWorkspace,
  workspaces,
  onSelectModule,
  onOpenWorkspaceManager,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
}) => {
  const civilLab = useCivilLab();
  const workbench = useWorkbench();

  const handleLaunchTool = (tool: {
    moduleId?: EngineeringModuleId;
    modalType?: 'architecture' | 'cad' | 'site-qc';
    modalTab?: any;
    subAction?: string;
  }) => {
    if (tool.moduleId) {
      onSelectModule(tool.moduleId, tool.subAction);
    } else if (tool.modalType === 'architecture' && onOpenArchitectureModal) {
      onOpenArchitectureModal(tool.modalTab || 'far');
    } else if (tool.modalType === 'cad' && onOpenCadModal) {
      onOpenCadModal(tool.modalTab || 'viewport');
    } else if (tool.modalType === 'site-qc' && onOpenSiteQcModal) {
      onOpenSiteQcModal();
    }
  };

  // Pinned tools list with full metadata
  const pinnedToolEntries = React.useMemo(() => {
    return civilLab.pinnedTools
      .map((id) => TOOL_REGISTRY.find((t) => t.id === id || t.moduleId === id))
      .filter((t): t is ToolRegistryEntry => Boolean(t));
  }, [civilLab.pinnedTools]);

  // Structured Categorized Workbench Sections
  const SECTIONS: CategoryDefinition[] = [
    {
      id: 'structural',
      title: 'Structural Engineering',
      subtitle: 'Flexural Analysis, Continuous FEM & Reinforcement Detailing',
      badge: 'ACI / AISC / BNBC',
      icon: SlidersHorizontal,
      accentColor: 'text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)]/30 bg-[var(--md-sys-color-primary-container)]/30',
      tools: [
        {
          id: 'beam-analysis',
          shortCode: 'STR-01',
          title: 'RC Beam Flexure, Shear & Deflection',
          description: 'Bending moment envelope, shear force, extreme fiber stress, and L/360 serviceability deflection check.',
          standardUsed: 'ACI 318-19 / BNBC 2020 / IS 456',
          icon: SlidersHorizontal,
          moduleId: 'beam-analysis',
        },
        {
          id: 'continuous-beam',
          shortCode: 'STR-02',
          title: 'Continuous Beam Multi-Span FEM Solver',
          description: 'Three-span direct stiffness formulation with support settlement, rotational elasticity, and moment redistribution.',
          standardUsed: 'Direct Stiffness Method / ACI 318',
          icon: SlidersHorizontal,
          moduleId: 'continuous-beam',
        },
        {
          id: 'rebar-bbs',
          shortCode: 'STR-03',
          title: 'Rebar BBS & Detailing Engine',
          description: 'Cutting lengths, ISO bend deductions, hook allowances, and bar diameter weight schedule (d²/162).',
          standardUsed: 'BS 8666 / SP 34 / BNBC 2020',
          icon: Hammer,
          moduleId: 'rebar-bbs',
        },
        {
          id: 'column-capacity',
          shortCode: 'STR-04',
          title: 'RC Column Design & P-M Interaction',
          description: 'Axial capacity Pn with slenderness ratio (kL/r), tie spacing, and interaction diagram envelope.',
          standardUsed: 'ACI 318-19 / BNBC Part 6',
          icon: Building,
          moduleId: 'rebar-bbs',
          subAction: 'column',
        },
        {
          id: 'slab-design',
          shortCode: 'STR-05',
          title: 'One-Way & Two-Way Slab Detailing',
          description: 'Moment coefficient analysis for edge-supported slabs, minimum slab thickness, and crack control steel.',
          standardUsed: 'BNBC 2020 / ACI 318',
          icon: Grid,
          moduleId: 'rebar-bbs',
          subAction: 'slab',
        },
        {
          id: 'footing-structural',
          shortCode: 'STR-06',
          title: 'Footing Structural Punching Shear & Flexure',
          description: 'Critical two-way punching perimeter (d/2), one-way wide beam shear, and bottom flexural reinforcement.',
          standardUsed: 'ACI 318 / BNBC 2020',
          icon: HardHat,
          moduleId: 'bearing-capacity',
        },
      ],
    },
    {
      id: 'geotechnical',
      title: 'Geotechnical Engineering',
      subtitle: 'Soil Mechanics, Foundation Bearing & Deep Piles',
      badge: 'Terzaghi / Meyerhof',
      icon: HardHat,
      accentColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      tools: [
        {
          id: 'bearing-capacity',
          shortCode: 'GEO-01',
          title: 'Shallow Footing Bearing Capacity',
          description: 'Ultimate & allowable bearing pressures (q_u, q_all) with Terzaghi bearing factors (Nc, Nq, Nγ) and water table factor.',
          standardUsed: 'Terzaghi / Meyerhof / BNBC 2020',
          icon: HardHat,
          moduleId: 'bearing-capacity',
        },
        {
          id: 'pile-capacity',
          shortCode: 'GEO-02',
          title: 'Deep Foundation Bored & Driven Pile Capacity',
          description: 'Skin resistance (Tomlinson α & β) and base end-bearing through multi-strata soil profiles with SPT-N blow counts.',
          standardUsed: 'Meyerhof SPT / Alpha Method',
          icon: HardHat,
          moduleId: 'pile-capacity',
        },
        {
          id: 'earth-pressure',
          shortCode: 'GEO-03',
          title: 'Lateral Earth Pressure on Retaining Walls',
          description: 'Active and passive earth pressure coefficients (Ka, Kp) via Rankine and Coulomb theories with surcharge loads.',
          standardUsed: 'Rankine / Coulomb / Bowles',
          icon: Shovel,
          moduleId: 'bearing-capacity',
        },
        {
          id: 'settlement-analysis',
          shortCode: 'GEO-04',
          title: 'Immediate Elastic & Consolidation Settlement',
          description: '1D Terzaghi consolidation and elastic displacement under uniform rectangular contact stresses.',
          standardUsed: 'Terzaghi 1D Consolidation',
          icon: Compass,
          moduleId: 'bearing-capacity',
        },
      ],
    },
    {
      id: 'architecture',
      title: 'Architecture & Planning',
      subtitle: 'Building By-Laws, Circulation & Sanitary Reservoirs',
      badge: 'RAJUK DAP / BNBC Part 3',
      icon: Building,
      accentColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      tools: [
        {
          id: 'architecture-far',
          shortCode: 'ARC-01',
          title: 'Floor Area Ratio (FAR) & Max Ground Coverage',
          description: 'Allowable gross construction area, Maximum Ground Coverage (MGC), and front/rear/side setbacks based on plot size & road width.',
          standardUsed: 'BNBC 2020 / RAJUK DAP',
          icon: Building,
          modalType: 'architecture',
          modalTab: 'far',
        },
        {
          id: 'architecture-staircase',
          shortCode: 'ARC-02',
          title: 'Building Staircase Riser & Tread Dimensioning',
          description: 'Blondel rule compliance (2R + T = 600–640mm), flight slope limits, landing clearance, and minimum headroom.',
          standardUsed: 'Blondel Formula / BNBC Part 3',
          icon: Compass,
          modalType: 'architecture',
          modalTab: 'staircase',
        },
        {
          id: 'architecture-watertank',
          shortCode: 'ARC-03',
          title: 'Underground & Overhead Water Reservoir Sizing',
          description: 'Calculates 24–48h domestic potable storage and emergency fire reserve based on occupancy demand.',
          standardUsed: 'BNBC Part 8 / IS 1172',
          icon: Waves,
          modalType: 'architecture',
          modalTab: 'watertank',
        },
        {
          id: 'architecture-septictank',
          shortCode: 'ARC-04',
          title: 'Septic Tank & Soak Pit Dimensioning Engine',
          description: 'Multi-chamber septic tank sizing, sludge accumulation rates, liquid retention periods, and effluent absorption soak pits.',
          standardUsed: 'BNBC Part 8 / IS 2470',
          icon: DropletsIcon,
          modalType: 'architecture',
          modalTab: 'septictank',
        },
      ],
    },
    {
      id: 'construction',
      title: 'Construction & BOQ Estimation',
      subtitle: 'Volumetric Concrete Mixes, Masonry & Granular Rates',
      badge: 'CPWD / PWD / SMM7',
      icon: FileSpreadsheet,
      accentColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      tools: [
        {
          id: 'boq-estimator',
          shortCode: 'BOQ-01',
          title: 'Quantity Takeoff & Bill of Quantities (BOQ)',
          description: 'Itemized L×W×H takeoff schedule with deductions, contractor margin, taxes, contingency allowances, and multi-currency formatting.',
          standardUsed: 'POMI / SMM7 Standards',
          icon: FileSpreadsheet,
          moduleId: 'boq-estimator',
        },
        {
          id: 'rate-analysis',
          shortCode: 'BOQ-02',
          title: 'Granular Unit Rate & Composite Cost Analysis',
          description: 'Breaks down 1 m³ composite concrete, brickwork, and plastering costs into raw materials, labor, and contractor overhead.',
          standardUsed: 'CPWD / PWD Schedule of Rates',
          icon: Calculator,
          moduleId: 'rate-analysis',
        },
        {
          id: 'concrete-mix',
          shortCode: 'MAT-01',
          title: 'ACI 211.1 Volumetric Concrete Mix Design',
          description: 'Target mean compressive strength f\'cr, water-cement ratio curve, absolute volume law, and 1 m³ trial batch formulations.',
          standardUsed: 'ACI 211.1 / ASTM C143',
          icon: Boxes,
          moduleId: 'concrete-mix',
        },
        {
          id: 'concrete-materials',
          shortCode: 'MAT-02',
          title: 'Concrete Bulk Technology & Bag Estimator',
          description: 'Calculates exact 50kg cement bag demand, sand CFT, and coarse aggregate CFT from wet RCC volumes using 1.54 dry factor.',
          standardUsed: 'Volumetric Method (1.54 Dry Factor)',
          icon: Sparkles,
          moduleId: 'concrete-materials',
        },
        {
          id: 'masonry-finishes',
          shortCode: 'MAT-03',
          title: 'Brick Masonry, Plaster & Wall Finishes Takeoff',
          description: 'Modular brick count with frog deductions, dry mortar requirements, and 2-side net plaster area excluding window/door openings.',
          standardUsed: 'IS 2212 / BNBC 2020 Part 6',
          icon: Grid,
          moduleId: 'masonry-finishes',
        },
        {
          id: 'site-qc-protocols',
          shortCode: 'QCS-01',
          title: 'Site Quality Control & Pre-Pour Checklists',
          description: 'Interactive checklists for pre-pour rebar inspection, slump tolerance verification, and 7/28-day cylinder compressive strength criteria.',
          standardUsed: 'ASTM C143 / ASTM C39 / BNBC',
          icon: ClipboardCheck,
          modalType: 'site-qc',
        },
      ],
    },
    {
      id: 'hydraulics',
      title: 'Hydraulics & Water Resources',
      subtitle: 'Open Channel Surface Flow & Pressure Conduits',
      badge: 'Manning / Hazen-Williams',
      icon: Waves,
      accentColor: 'text-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)]/30 bg-[var(--md-sys-color-primary-container)]/30',
      tools: [
        {
          id: 'open-channel',
          shortCode: 'HYD-01',
          title: 'Open Channel Flow Hydraulics (Manning Solver)',
          description: 'Solves discharge capacity Q, flow velocity, wetted perimeter, hydraulic radius, and subcritical/supercritical Froude regime.',
          standardUsed: 'Manning Formulation / Chow Hydraulics',
          icon: Waves,
          moduleId: 'open-channel',
        },
        {
          id: 'pipe-hydraulics',
          shortCode: 'HYD-02',
          title: 'Pressurized Pipe & Storm Conduits Solver',
          description: 'Calculates head friction loss, hydraulic gradient, flow velocity, and Reynolds number across PVC, HDPE, and ductile iron pipelines.',
          standardUsed: 'Hazen-Williams / Darcy-Weisbach',
          icon: Waves,
          moduleId: 'pipe-hydraulics',
        },
      ],
    },
    {
      id: 'cad-excel',
      title: 'CAD & Excel Engineering Hub',
      subtitle: 'AutoCAD Viewports, Command Aliases & Formula Macros',
      badge: 'AutoCAD / ISO / LISP',
      icon: Terminal,
      accentColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
      tools: [
        {
          id: 'cad-viewport',
          shortCode: 'CAD-01',
          title: 'AutoCAD Layout Viewport Scale & Zoom XP Factors',
          description: 'Computes exact Zoom XP scale factors for 1:50, 1:100, 1:200 architectural and structural drawing sheets in millimeter PaperSpace.',
          standardUsed: 'Standard Metric ISO Drawing Scales',
          icon: Terminal,
          modalType: 'cad',
          modalTab: 'viewport',
        },
        {
          id: 'cad-shortcuts',
          shortCode: 'CAD-02',
          title: 'AutoCAD Professional Command Aliases & LISP',
          description: 'Searchable cheat-sheet of 60+ critical engineering AutoCAD commands, keyboard aliases, and custom AutoLISP routines (TLEN, XYZ export).',
          standardUsed: 'AutoCAD Native Shortcut Registry',
          icon: Terminal,
          modalType: 'cad',
          modalTab: 'shortcuts',
        },
        {
          id: 'cad-excel-hub',
          shortCode: 'CAD-03',
          title: 'Structural Engineering Excel & Spreadsheet Formulas',
          description: 'Copyable formulas for linear stress interpolation, bar bending mass matrices, distance between coordinates, and dynamic BOQ aggregation.',
          standardUsed: 'ISO Structural Calc Sheet Standards',
          icon: FileText,
          modalType: 'cad',
          modalTab: 'excel',
        },
      ],
    },
    {
      id: 'site-management',
      title: 'Site Management & Field ERP',
      subtitle: 'মাঠ ও নির্মাণ ব্যবস্থাপনা — Store, Requisitions, Muster Roll, Bills, Cash, Tests & DPR',
      badge: 'FIELD ERP / BNBC / ISO 9001',
      icon: ClipboardCheck,
      accentColor: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
      tools: [
        {
          id: 'store-inventory',
          shortCode: 'SM-01',
          title: 'Store & Inventory Ledger (মালামাল ইন-আউট)',
          description: 'Live material balances, inward challan deliveries, outward floor issues, and theoretical BOQ variance tracking.',
          standardUsed: 'Material Control / BOQ Variance',
          icon: Boxes,
          moduleId: 'store-inventory',
        },
        {
          id: 'material-requisition',
          shortCode: 'SM-02',
          title: 'Material Requisition Slip & PO Generator (রিকুইজিশন)',
          description: 'Multi-item procurement indents, real-time store balances, WhatsApp order sharing, and auto-receive into Store.',
          standardUsed: 'Purchase Indents / ISO 9001 Procurement',
          icon: FileText,
          moduleId: 'material-requisition',
        },
        {
          id: 'schedule-roster',
          shortCode: 'SM-03',
          title: 'Project Construction Schedule & Engineer Roster (শিডিউল)',
          description: 'Construction progress milestones, smart concrete casting curing & de-shuttering calendars, and engineer daily checklists.',
          standardUsed: 'ACI 308 Curing / ACI 347 De-shuttering',
          icon: Calendar,
          moduleId: 'schedule-roster',
        },
        {
          id: 'labor-attendance',
          shortCode: 'SM-04',
          title: 'Labor Muster Roll & Wage Manager (লেবার হাজিরা ও মজুরি)',
          description: 'Full-month 1-31 days Present Book (হাজিরা খাতা), P/H/OT/A marking, Khoraki advances, and automated net wage calculations.',
          standardUsed: 'Muster Roll & Daily Wage Practices',
          icon: Users,
          moduleId: 'labor-attendance',
        },
        {
          id: 'field-notebook',
          shortCode: 'SM-05',
          title: 'Smart Engineering Field Diary & Instructions (সাইট নোটবুক)',
          description: 'Structured site notebook with date/time, #Grid tags, speech-to-text voice dictation, and client/architect instruction logs.',
          standardUsed: 'Engineering Site Diary Protocol',
          icon: BookOpen,
          moduleId: 'field-notebook',
        },
        {
          id: 'contractor-bills',
          shortCode: 'SM-06',
          title: 'Sub-Contractor RA Bill & Measurement Tracker (কন্ট্রাক্টর বিল)',
          description: 'Sequential Running Account (RA) Certification with cumulative measurements, security retention holding, and 3-tier sign-offs.',
          standardUsed: 'FIDIC / CPWD Sub-Contractor Billing',
          icon: Receipt,
          moduleId: 'contractor-bills',
        },
        {
          id: 'petty-cash',
          shortCode: 'SM-07',
          title: 'Site Petty Cash & Daily Expense Imprest (খুচরা ক্যাশ হিসাব)',
          description: 'Site engineer imprest fund management with debit/credit logging, low-balance warnings, voucher slips, and financial rollup.',
          standardUsed: 'Standard Imprest Accounting System',
          icon: Wallet,
          moduleId: 'petty-cash',
        },
        {
          id: 'cube-tests',
          shortCode: 'SM-08',
          title: 'Concrete Pour & Cube/Cylinder Test Log (কিউব টেস্ট রেজিস্টার)',
          description: 'Pour logging with auto-calculated 7-day and 28-day crushing schedules, DCR strength compliance, and test certificates.',
          standardUsed: 'ASTM C39 / BS 1881 / BNBC 2020',
          icon: Layers,
          moduleId: 'cube-tests',
        },
        {
          id: 'daily-progress-report',
          shortCode: 'SM-09',
          title: 'Master 1-Click Daily Progress Report — DPR (ডেইলি প্রগ্রেস রিপোর্ট)',
          description: '1-Click automated synthesis of attendance headcount, store deliveries, active milestones, and petty cash into an official A4 DPR.',
          standardUsed: 'Construction Project DPR Protocol',
          icon: ClipboardCheck,
          moduleId: 'daily-progress-report',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-20 font-sans">
      {/* 1. TOP QUICK-ACCESS & ACTIVE PROJECT BAR */}
      <div className="rounded-2xl p-4 sm:p-5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-lg shadow-black/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
          {/* Active Project Identification */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--md-sys-color-primary)]/10 border border-[var(--md-sys-color-primary)]/30 flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)]">
                  Active Project
                </span>
                <span className="font-mono text-xs font-bold text-[var(--md-sys-color-on-surface-variant)]">
                  {activeWorkspace.projectCode}
                </span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  · {workspaces.length} Total Projects
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight truncate mt-0.5">
                {activeWorkspace.name}
              </h1>
              <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-2 mt-0.5 truncate">
                <span>Location: {activeWorkspace.siteLocation}</span>
                <span>•</span>
                <span>Currency: {activeWorkspace.currency}</span>
                <span>•</span>
                <span>EOR: {activeWorkspace.engineerOfRecord}</span>
              </div>
            </div>
          </div>

          {/* Quick Status Badges & Controls */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Unit Toggle Badge */}
            <button
              type="button"
              onClick={workbench.toggleUnitSystem}
              className="px-3.5 py-1.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[var(--md-sys-color-on-surface)] shadow-xs"
              title="Click to toggle Global Unit System (SI <-> Imperial)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>{workbench.unitSystem === 'SI' ? 'SI Units (kN, m, MPa)' : 'Imperial (kip, ft, psi)'}</span>
            </button>

            {/* Governing Code Badge */}
            <div className="px-3.5 py-1.5 rounded-full border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-xs font-mono font-bold flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)] shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-[var(--md-sys-color-secondary)]" />
              <span>{activeWorkspace.governingCode}</span>
            </div>

            {/* Manage Workspaces Button */}
            <button
              type="button"
              onClick={onOpenWorkspaceManager}
              className="px-4 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
            >
              Manage Projects
            </button>
          </div>
        </div>

        {/* Pinned Tools Row */}
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Pinned Quick-Launch Tools ({pinnedToolEntries.length})</span>
            </div>
            <button
              type="button"
              onClick={() => civilLab.setActivePage('all')}
              className="text-xs font-mono text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Customize in All Tools</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pinnedToolEntries.length === 0 ? (
            <div className="py-2 px-3 rounded-xl border border-dashed border-[var(--md-sys-color-outline)] text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-between">
              <span>No tools pinned yet. Pin your everyday tools for instant 1-click launch.</span>
              <button
                type="button"
                onClick={() => civilLab.setActivePage('all')}
                className="px-3.5 py-1 rounded-full bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] font-bold cursor-pointer"
              >
                Browse & Pin Tools
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {pinnedToolEntries.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => handleLaunchTool(tool)}
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] text-left transition-all shrink-0 cursor-pointer shadow-2xs"
                  title={`${tool.title} (${tool.standardUsed})`}
                >
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)]">
                    {tool.shortCode}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors truncate max-w-[150px]">
                      {tool.shortLabel}
                    </div>
                    <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {tool.subCategory}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. CATEGORIZED WORKBENCH SECTIONS */}
      <div className="space-y-8">
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;

          return (
            <section
              key={section.id}
              className="rounded-2xl p-5 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-md space-y-4"
            >
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${section.accentColor} shrink-0`}>
                    <SectionIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                        {section.title}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline)]">
                        {section.tools.length} Tools
                      </span>
                    </div>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                      {section.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] self-start sm:self-auto">
                  Governing Standards: <strong className="text-[var(--md-sys-color-on-surface)]">{section.badge}</strong>
                </div>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {section.tools.map((tool) => {
                  const isPinned = civilLab.isToolPinned(tool.id);

                  return (
                    <div
                      key={tool.id}
                      className="group rounded-xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] transition-all flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md"
                    >
                      <div>
                        {/* Header: Short Code + Pin Toggle */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)]">
                            {tool.shortCode}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              civilLab.togglePinTool(tool.id);
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isPinned
                                ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-amber-500 hover:bg-[var(--md-sys-color-surface)]'
                            }`}
                            title={isPinned ? 'Unpin from Top Bar' : 'Pin to Top Bar'}
                            aria-label={isPinned ? 'Unpin tool' : 'Pin tool'}
                          >
                            {isPinned ? (
                              <Pin className="w-3.5 h-3.5 fill-amber-500" />
                            ) : (
                              <Pin className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors leading-snug">
                          {tool.title}
                        </h3>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed mt-1 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      {/* Footer: Standard & Action Button */}
                      <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] truncate">
                          {tool.standardUsed}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleLaunchTool(tool)}
                          className="px-3 py-1 rounded-full bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] group-hover:bg-[var(--md-sys-color-primary)] group-hover:text-[var(--md-sys-color-on-primary)] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* 3. REFINED MISSION & ABOUT PB CIVILLAB SECTION */}
      <footer className="rounded-2xl p-6 sm:p-8 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-xl relative overflow-hidden">
        {/* Subtle Background Pattern Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--md-sys-color-primary)]/5 pointer-events-none blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Brand & Vision Statement */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-3">
                <LogoMark size={28} className="text-[var(--md-sys-color-primary)]" />
                <div>
                  <h3 className="text-xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                    PB CivilLab
                  </h3>
                  <div className="text-[10px] font-mono uppercase font-bold tracking-widest text-[var(--md-sys-color-primary)]">
                    Calculate Smarter. Build Better.
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                Empowering civil engineers, structural designers, quantity surveyors, architects, and construction managers with transparent, mathematically verifiable, and code-compliant engineering calculations. Engineered as a zero-latency client-side workbench running 100% locally in your browser.
              </p>
            </div>

            {/* Author Attribution Card */}
            <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-xs font-mono space-y-1 shrink-0 md:min-w-[260px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                Lead Architect &amp; Developer
              </div>
              <div className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                Prokash Biswas
              </div>
              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                Civil &amp; Structural Software Engineer
              </div>
              <div className="pt-1 text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                Contact: <a href="mailto:prokashbiswas8801@gmail.com" className="text-[var(--md-sys-color-primary)] hover:underline">prokashbiswas8801@gmail.com</a>
              </div>
            </div>
          </div>

          {/* Supported Engineering Codes & Standards Badges */}
          <div className="space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Supported Building Codes &amp; Design Standards
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { code: 'BNBC-2020', name: 'Bangladesh National Building Code (Part 3, 6 & 8)' },
                { code: 'ACI 318-19', name: 'Building Code Requirements for Structural Concrete' },
                { code: 'IS 456:2000', name: 'Plain and Reinforced Concrete Code of Practice' },
                { code: 'ASTM International', name: 'Standard Test Methods (C39, C143, A615)' },
                { code: 'AISC 360-16', name: 'Specification for Structural Steel Buildings' },
                { code: 'BS 8666:2020', name: 'Scheduling, Dimensioning & Bending of Steel Bars' },
                { code: 'Eurocode 2 / 3', name: 'Design of Concrete & Steel Structures (EN 1992/1993)' },
                { code: 'CPWD / PWD SOR', name: 'Central Public Works Department Schedule of Rates' },
              ].map((badge) => (
                <div
                  key={badge.code}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-xs font-mono flex items-center gap-1.5"
                  title={badge.name}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-bold text-[var(--md-sys-color-on-surface)]">{badge.code}</span>
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline">
                    · {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Build Info & Privacy Notice */}
          <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
            <div className="flex items-center gap-2">
              <span>PB CivilLab v2.5.0-PRO (Build 2026.10)</span>
              <span>•</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Local-First Client Storage Engine
              </span>
            </div>
            <div>
              100% Client-Side Privacy — Zero Server Telemetry
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Fallback helper icon
function DropletsIcon(props: { className?: string }) {
  return <Waves {...props} />;
}
