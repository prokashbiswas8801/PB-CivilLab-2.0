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
  ScrollText,
  AlertTriangle,
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
  bilingualTag?: string;
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
  const [aboutLang, setAboutLang] = React.useState<'bn' | 'en'>('bn');

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
      bilingualTag: 'স্ট্রাকচারাল ইঞ্জিনিয়ারিং',
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
        {
          id: 'frame-truss-2d',
          shortCode: 'STR-07',
          title: '2D Frame & Truss Solver + P-Delta',
          description: 'Direct Stiffness Method planar frame/truss solver with hinge releases, BMD/SFD/AFD overlays, and 2nd-order P-Delta buckling.',
          standardUsed: 'BNBC-2020 / AISC 360 / Eurocode 3',
          icon: SlidersHorizontal,
          moduleId: 'frame-truss-2d',
        },
        {
          id: 'section-analyzer',
          shortCode: 'STR-08',
          title: 'Section Stresses & Plastic N-M Interaction',
          description: 'Geometric inertia, EC3/AISC Class 1–4 checks, biaxial elastic/shear profiles, shifted PNA, and N-M / My-Mz plastic envelopes.',
          standardUsed: 'Eurocode 3 / AISC 360 / BNBC-2020',
          icon: Layers,
          moduleId: 'section-analyzer',
        },
        {
          id: 'rc-column-design',
          shortCode: 'STR-09',
          title: 'RC Column N-M Interaction & Slenderness',
          description: 'Strain-compatibility Nominal & Design (φ) P-M interaction curves, Bresler biaxial contour check, and δ_ns slenderness magnifier.',
          standardUsed: 'BNBC-2020 / ACI 318-19 / Eurocode 2',
          icon: Grid,
          moduleId: 'rc-column-design',
        },
        {
          id: 'strut-and-tie',
          shortCode: 'STR-10',
          title: 'Strut-and-Tie Model (STM) D-Region Solver',
          description: '2D truss stiffness & Method of Joints solver for deep beams, corbels, and pile caps with strut/tie classification and As,tie sizing.',
          standardUsed: 'ACI 318-19 Ch. 23 (Partial Scope)',
          icon: Compass,
          moduleId: 'strut-and-tie',
        },
      ],
    },
    {
      id: 'geotechnical',
      title: 'Geotechnical Engineering',
      bilingualTag: 'জিওটেকনিক্যাল',
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
      bilingualTag: 'আর্কিটেকচার ও প্ল্যানিং',
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
      bilingualTag: 'এস্টিমেশন ও কনক্রিট',
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
      bilingualTag: 'হাইড্রলিক্স ও প্লাম্বিং',
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
      bilingualTag: 'ক্যাড ও এক্সেল',
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
      bilingualTag: 'সাইট ম্যানেজমেন্ট ও ফিল্ড ইআরপি',
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
        {
          id: 'office-docs',
          shortCode: 'SM-10',
          title: 'Official Letters & Office Docs (অফিসিয়াল চিঠি ও সনদ)',
          description: 'Bilingual legal/contractual office documents: Material Gate Pass, Work Orders, Joint Measurement Forwarding Letters, NCRs, and Handover Certificates.',
          standardUsed: 'BNBC-2020 / FIDIC Civil Contract Practice',
          icon: ScrollText,
          moduleId: 'office-docs',
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-20 font-sans">
      {/* Refined Welcome Hero Banner with Subtle Bengali Micro-copy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
              <span className="text-[var(--md-sys-color-primary)] font-black">BD.</span> CivilLab
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)]/50 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/30">
              Workbench
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] mt-1">
            <span className="font-nikosh tracking-normal text-sm" lang="bn">আধুনিক স্ট্রাকচারাল অ্যানালাইসিস, এস্টিমেশন ও সাইট ম্যানেজমেন্ট স্যুট</span> &bull; <span className="font-mono text-[11px] opacity-80">Calculate Smarter. Build Better.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://www.facebook.com/BD.CivilLab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 text-xs font-semibold transition-all shadow-2xs"
            title="BD. CivilLab Official Facebook Page (ফেসবুক পেজ)"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook Page</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>

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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                        {section.title}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline)]">
                        {section.tools.length} Tools
                      </span>
                      {section.bilingualTag && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--md-sys-color-primary-container)]/40 text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-primary)]/20 hidden sm:inline-block">
                          {section.bilingualTag}
                        </span>
                      )}
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

      {/* 3. DEDICATED BILINGUAL ABOUT BD. CIVILLAB & HONEST DISCLAIMER SECTION */}
      <footer className="rounded-2xl p-6 sm:p-8 border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-xl relative overflow-hidden space-y-6">
        {/* Subtle Background Pattern Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[var(--md-sys-color-primary)]/5 pointer-events-none blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Header Bar: Brand Lockup & Language Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--md-sys-color-outline-variant)]">
            <div className="flex items-center gap-3">
              <LogoMark size={32} className="text-[var(--md-sys-color-primary)] shrink-0" />
              <div>
                <h3 className="text-xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                  <span className="text-[var(--md-sys-color-primary)] font-black">BD.</span> CivilLab
                </h3>
                <div className="text-[10.5px] font-mono uppercase font-bold tracking-widest text-[var(--md-sys-color-on-surface-variant)]">
                  {aboutLang === 'bn' ? 'আমাদের সম্পর্কে · সিভিল ইঞ্জিনিয়ারিং ওয়ার্কবেঞ্চ' : 'About BD. CivilLab · Professional Engineering Suite'}
                </div>
              </div>
            </div>

            {/* Bilingual Switcher Tabs (বাংলা | English) */}
            <div className="flex items-center bg-[var(--md-sys-color-surface-container-low)] p-1 rounded-full border border-[var(--md-sys-color-outline)] self-start sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setAboutLang('bn')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  aboutLang === 'bn'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setAboutLang('en')}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  aboutLang === 'en'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-xs font-bold'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Bilingual Overview & Creator Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Overview & Detailed Engineering Description */}
            <div className="lg:col-span-8 space-y-4">
              {aboutLang === 'bn' ? (
                <div className="space-y-3 text-sm sm:text-base text-[var(--md-sys-color-on-surface-variant)] leading-relaxed font-nikosh" lang="bn">
                  <p>
                    <strong className="text-[var(--md-sys-color-on-surface)] font-bold">BD. CivilLab</strong> হলো একটি সমন্বিত, ক্লায়েন্ট-সাইড সিভিল ইঞ্জিনিয়ারিং স্ট্রাকচারাল অ্যানালাইসিস, ফাউন্ডেশন বেয়ারিং ক্যাপাসিটি, BNBC-2020 / ACI-318 আরসিসি ডিজাইন, রিবার বার বেন্ডিং শিডিউল (BBS), প্রাক্কলন ও বিল অব কোয়ান্টিটিজ (BOQ), ইউনিট রেট অ্যানালাইসিস, ওপেন চ্যানেল হাইড্রলিক্স ও প্লাম্বিং, আর্কিটেকচারাল বাই-লজ এবং সাইট কনস্ট্রাকশন ম্যানেজমেন্ট ইআরপি (ERP) ওয়ার্কবেঞ্চ।
                  </p>
                  <p>
                    এটি বিশেষভাবে বাংলাদেশের ও আন্তর্জাতিক সিভিল ইঞ্জিনিয়ার, সাইট সুপারভাইজার, স্ট্রাকচারাল ডিজাইনার ও এস্টিমেটরদের বাস্তবসম্মত দ্রুত কাজের সুবিধার্থে তৈরি করা হয়েছে। শতভাগ লোকাল ও অফলাইন সক্ষম, যা ব্রাউজারের ভেতর সম্পূর্ণ ডেটা গোপনীয়তা বজায় রেখে তাৎক্ষণিক হিসাব ও প্রফেশনাল সাবমিটাল A4 PDF/Excel শিডিউল তৈরি করে।
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                  <p>
                    <strong className="text-[var(--md-sys-color-on-surface)] font-bold">BD. CivilLab</strong> is an enterprise-grade, client-side civil engineering computational suite delivering rigorous structural flexure &amp; shear analysis, geotechnical shallow/deep foundation bearing capacity, BNBC-2020 / ACI-318 RC element detailing, rebar bar bending schedules (BBS), quantity takeoff (BOQ), composite rate analysis, open channel &amp; pipe hydraulics, architectural by-laws, and construction site field ERP.
                  </p>
                  <p>
                    Engineered specifically for practicing civil and structural engineers, site supervisors, and cost estimators in Bangladesh and worldwide, it features a 100% offline-first local storage architecture with zero server telemetry and publication-ready certified A4 PDF/Excel calculation submittals.
                  </p>
                </div>
              )}

              {/* Honest Engineering Disclaimer Callout (ত্রুটি-বিচ্যুতি সংক্রান্ত সতর্কবার্তা) */}
              <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className={aboutLang === 'bn' ? 'font-nikosh text-sm' : ''} lang={aboutLang === 'bn' ? 'bn' : undefined}>
                    {aboutLang === 'bn'
                      ? 'ত্রুটি-বিচ্যুতি সংক্রান্ত সতর্কমূলক ঘোষণা (Engineering Disclaimer)'
                      : 'Honest Engineering Disclaimer & Verification Notice'}
                  </span>
                </div>
                <p className={`text-xs leading-relaxed opacity-95 ${aboutLang === 'bn' ? 'font-nikosh text-sm sm:text-[15px]' : 'font-sans'}`} lang={aboutLang === 'bn' ? 'bn' : undefined}>
                  {aboutLang === 'bn' ? (
                    <>
                      <strong>মানুষ মাত্রই ভুলের ঊর্ধ্বে নয়; তাই এই অ্যাপ বা ওয়েবসাইটের হিসাব-নিকাশ বা কোডিংয়ে অনিচ্ছাকৃত ভুল-ত্রুটি থাকতেই পারে।</strong> প্রতিটি সূত্র ও ক্যালকুলেশন মডিউল BNBC-2020, ACI 318, IS 456 এবং AISC 360 সহ প্রমিত প্রকৌশল কোডের আলোকে সর্বোচ্চ সতর্কতার সাথে প্রস্তুত করা হয়েছে। তা সত্ত্বেও সাইটে বা ফিল্ডে চূড়ান্ত নির্মাণ বা আর্থিক বাস্তবায়নের পূর্বে যেকোনো গুরুত্বপূর্ণ স্ট্রাকচারাল, রিবার কিংবা মালামালের হিসাব দায়িত্বপ্রাপ্ত লাইসেন্সধারী ইঞ্জিনিয়ার (PE/SE) দ্বারা ক্রস-চেক (যাচাই) করে নেয়ার অনুরোধ করা হচ্ছে। কোনো অনিচ্ছাকৃত ভুল পরিলক্ষিত হলে বা কোনো গঠনমূলক পরামর্শ থাকলে সানন্দে তা জানানোর অনুরোধ রইল।
                    </>
                  ) : (
                    <>
                      <strong>To err is human; unintentional computational variations, rounding nuances, or software discrepancies may exist.</strong> While every engineering module, algorithmic formula, and code envelope has been diligently designed according to statutory standards (BNBC 2020, ACI 318-19, IS 456, AISC 360, and ASTM), software calculations serve primarily for estimation, academic verification, preliminary sizing, and field guidance. Users are strongly advised to independently verify all structural reinforcement, foundation capacities, and budget allocations with a registered Professional Engineer (PE / SE) prior to site execution. We warmly welcome any bug reports, critiques, or suggestions.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Right 4 Cols: Creator Attribution & Social Connect Card */}
            <div className="lg:col-span-4 p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3.5">
              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-[var(--md-sys-color-primary)]">
                  {aboutLang === 'bn' ? 'নির্মাতা ও সফটওয়্যার আর্কিটেক্ট' : 'Creator & Software Architect'}
                </div>
                <div className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Prokash Biswas (প্রকাশ বিশ্বাস)
                </div>
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Civil &amp; Structural Software Engineer
                </div>
              </div>

              {/* Creator & Official Community Social Connect Buttons */}
              <div className="space-y-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
                {/* 1. Official Facebook Page Button */}
                <a
                  href="https://www.facebook.com/BD.CivilLab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#1877F2] text-white hover:bg-blue-600 transition-colors shadow-xs text-xs font-semibold"
                  title="Visit BD. CivilLab Official Facebook Page (অফিসিয়াল ফেসবুক পেজ)"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>BD. CivilLab Official Page</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                {/* 2. Creator Personal Facebook Profile Button */}
                <a
                  href="https://www.facebook.com/prokash.biswas.88073"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] transition-colors text-xs font-semibold"
                  title="Connect with Creator Prokash Biswas on Facebook (নির্মাতার ফেসবুক প্রোফাইল)"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>{aboutLang === 'bn' ? 'নির্মাতার ফেসবুক প্রোফাইল' : "Creator's Facebook Profile"}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)]" />
                </a>

                {/* 3. Direct Email Contact */}
                <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] pt-1 text-center">
                  Email: <a href="mailto:prokashbiswas8801@gmail.com" className="text-[var(--md-sys-color-primary)] hover:underline font-semibold">prokashbiswas8801@gmail.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Supported Engineering Codes & Standards Badges */}
          <div className="space-y-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              {aboutLang === 'bn' ? 'সমর্থিত আন্তর্জাতিক ও জাতীয় বিল্ডিং কোড সমূহ' : 'Supported Building Codes & Design Standards'}
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
              <span className="font-bold text-[var(--md-sys-color-on-surface)]">BD. CivilLab v2.6.0-PRO</span>
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
