import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Home,
  Search,
  Printer,
  ShieldCheck,
  SlidersHorizontal,
  ArrowRightLeft,
  ArrowUpRight,
  Pin,
  FolderArchive,
  Calculator,
  Boxes,
  HardHat,
  Waves,
  ClipboardCheck,
  FlaskConical,
  Building,
  Compass,
  FileSpreadsheet,
  Hammer,
  Grid,
  Layers,
  Calendar,
  Users,
  BookOpen,
  Receipt,
  Wallet,
  ScrollText,
  Shovel,
  Terminal,
  FileText,
  Sparkles,
  History,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';
import {
  EngineeringModuleId,
  CivilWorkspace,
  ArchitectureTab,
  UnitSystemPreset,
  CalculationRecord,
} from '../../types/civil';
import { useCivilLab } from '../../context/CivilLabContext';
import { useWorkbench, GlobalUnitSystem } from '../../context/WorkbenchContext';
import { useSiteManagement } from '../../context/SiteManagementContext';
import { TOOL_REGISTRY_MAP, ToolRegistryEntry } from '../../data/toolRegistry';
import { TESTING_LAB_TESTS } from '../../data/testingLabCatalog';
import { computeBOQEstimator, getCurrencySymbol } from '../../utils/calculations';
import {
  EXACT_CONVERSION,
  formatFeetInches,
  parseFeetInchString,
} from '../../utils/unitConverter';
import { NumericDraftInput } from '../ui/NumericDraftInput';
import { LogoMark, OFFICIAL_TAGLINE } from '../Logo';

export interface HomePageProps {
  activeWorkspace: CivilWorkspace;
  workspaces: CivilWorkspace[];
  onSelectModule: (moduleId: EngineeringModuleId, subAction?: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onOpenNewWorkspace: () => void;
  onOpenWorkspaceManager: () => void;
  onOpenProfileModal?: (tab?: 'profile' | 'preferences' | 'presets') => void;
  onOpenArchitectureModal?: (tab: ArchitectureTab) => void;
  onOpenCadModal?: (tab: 'viewport' | 'shortcuts' | 'excel') => void;
  onOpenSiteQcModal?: () => void;
  onOpenPrintPreview?: () => void;
  onDirectDownloadPdf?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenVerifySubmittal?: () => void;
  onSelectUnitPreset?: (preset: UnitSystemPreset) => void;
  calculationHistory?: CalculationRecord[];
}

type DisciplineFilterId =
  | 'all'
  | 'structural'
  | 'geotechnical'
  | 'takeoff-boq'
  | 'hydraulics-survey'
  | 'site-erp'
  | 'lab-qaqc';

interface DisciplineTheme {
  id: Exclude<DisciplineFilterId, 'all'>;
  label: string;
  bengaliTag: string;
  iconBg: string;
  badgeText: string;
  hoverBorder: string;
  pillActive: string;
}

const DISCIPLINE_THEMES: Record<Exclude<DisciplineFilterId, 'all'>, DisciplineTheme> = {
  structural: {
    id: 'structural',
    label: 'Structural',
    bengaliTag: 'স্ট্রাকচারাল বিশ্লেষণ',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
    badgeText: 'text-amber-700 dark:text-amber-300',
    hoverBorder: 'hover:border-amber-500/50',
    pillActive: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
  },
  geotechnical: {
    id: 'geotechnical',
    label: 'Geotechnical',
    bengaliTag: 'মাটির ভারবহন',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    hoverBorder: 'hover:border-emerald-500/50',
    pillActive: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  },
  'takeoff-boq': {
    id: 'takeoff-boq',
    label: 'Takeoff & BOQ',
    bengaliTag: 'বিওকিউ ও এস্টিমেট',
    iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    hoverBorder: 'hover:border-indigo-500/50',
    pillActive: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40',
  },
  'hydraulics-survey': {
    id: 'hydraulics-survey',
    label: 'Hydraulics & Survey',
    bengaliTag: 'হাইড্রলিক্স ও সার্ভে',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25',
    badgeText: 'text-sky-700 dark:text-sky-300',
    hoverBorder: 'hover:border-sky-500/50',
    pillActive: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
  },
  'site-erp': {
    id: 'site-erp',
    label: 'Site ERP',
    bengaliTag: 'সাইট ব্যবস্থাপনা',
    iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/25',
    badgeText: 'text-teal-700 dark:text-teal-300',
    hoverBorder: 'hover:border-teal-500/50',
    pillActive: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/40',
  },
  'lab-qaqc': {
    id: 'lab-qaqc',
    label: 'Lab QA/QC',
    bengaliTag: 'ল্যাব টেস্ট',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25',
    badgeText: 'text-rose-700 dark:text-rose-300',
    hoverBorder: 'hover:border-rose-500/50',
    pillActive: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
  },
};

interface ModuleLaunchCardItem {
  id: string;
  shortCode: string;
  title: string;
  bengaliTag: string;
  summary: string;
  standardUsed: string;
  discipline: Exclude<DisciplineFilterId, 'all'>;
  icon: React.ComponentType<{ className?: string }>;
  moduleId: EngineeringModuleId;
  subAction?: string;
}

const MODULE_LAUNCHPAD_ITEMS: ModuleLaunchCardItem[] = [
  // Structural & RCC
  {
    id: 'beam-analysis',
    shortCode: 'STR-01',
    title: 'RC Beam Flexure & Shear',
    bengaliTag: 'বীম অ্যানালাইসিস',
    summary: 'BMD/SFD envelopes, flexural rebar design & L/360 deflection.',
    standardUsed: 'ACI 318-19 / BNBC 2020',
    discipline: 'structural',
    icon: SlidersHorizontal,
    moduleId: 'beam-analysis',
  },
  {
    id: 'continuous-beam',
    shortCode: 'STR-02',
    title: 'Continuous Beam FEM Solver',
    bengaliTag: 'কন্টিনিউয়াস বীম',
    summary: 'Multi-span direct stiffness, settlement & moment redistribution.',
    standardUsed: 'Direct Stiffness / ACI 318',
    discipline: 'structural',
    icon: SlidersHorizontal,
    moduleId: 'continuous-beam',
  },
  {
    id: 'rebar-bbs',
    shortCode: 'STR-03',
    title: 'Rebar BBS & Detailing',
    bengaliTag: 'রডের বিবিএস',
    summary: 'ISO cutting lengths, bend deductions, laps & d²/162 tonnage.',
    standardUsed: 'BS 8666 / BNBC 2020',
    discipline: 'structural',
    icon: Hammer,
    moduleId: 'rebar-bbs',
  },
  {
    id: 'frame-truss-2d',
    shortCode: 'STR-04',
    title: '2D Frame & Truss + P-Delta',
    bengaliTag: 'ফ্রেম ও ট্রাস',
    summary: 'Planar stiffness solver, BMD/SFD/AFD & 2nd-order buckling.',
    standardUsed: 'BNBC-2020 / AISC 360 / EC3',
    discipline: 'structural',
    icon: Compass,
    moduleId: 'frame-truss-2d',
  },
  {
    id: 'section-analyzer',
    shortCode: 'STR-05',
    title: 'Section Stresses & Plastic N-M',
    bengaliTag: 'সেকশন অ্যানালাইজার',
    summary: 'Inertia, EC3 Class 1–4 checks, biaxial stress & PNA shift.',
    standardUsed: 'Eurocode 3 / AISC 360',
    discipline: 'structural',
    icon: Layers,
    moduleId: 'section-analyzer',
  },
  {
    id: 'rc-column-design',
    shortCode: 'STR-06',
    title: 'RC Column N-M & Slenderness',
    bengaliTag: 'কলাম ডিজাইন',
    summary: 'Strain-compatibility P-M curves, Bresler biaxial & δ_ns check.',
    standardUsed: 'BNBC-2020 / ACI 318-19',
    discipline: 'structural',
    icon: Building,
    moduleId: 'rc-column-design',
  },
  {
    id: 'strut-and-tie',
    shortCode: 'STR-07',
    title: 'Strut-and-Tie (STM) Solver',
    bengaliTag: 'স্ট্রাট অ্যান্ড টাই',
    summary: 'Deep beams, corbels & pile caps nodal force & As,tie sizing.',
    standardUsed: 'ACI 318-19 Ch. 23',
    discipline: 'structural',
    icon: Grid,
    moduleId: 'strut-and-tie',
  },

  // Geotechnical & Foundation
  {
    id: 'bearing-capacity',
    shortCode: 'GEO-01',
    title: 'Shallow Footing Bearing Capacity',
    bengaliTag: 'মাটির ভারবহন',
    summary: 'Terzaghi/Meyerhof q_u, q_all, water factor & settlement.',
    standardUsed: 'Terzaghi / Meyerhof / BNBC',
    discipline: 'geotechnical',
    icon: HardHat,
    moduleId: 'bearing-capacity',
  },
  {
    id: 'pile-capacity',
    shortCode: 'GEO-02',
    title: 'Deep Pile Bearing & Skin Friction',
    bengaliTag: 'পাইল ক্যাপাসিটি',
    summary: 'Bored & driven multi-strata SPT-N & Tomlinson α/β capacity.',
    standardUsed: 'Meyerhof SPT / BNBC 2020',
    discipline: 'geotechnical',
    icon: HardHat,
    moduleId: 'pile-capacity',
  },

  // Estimation, Takeoff & BOQ
  {
    id: 'boq-estimator',
    shortCode: 'BOQ-01',
    title: 'Quantity Takeoff & BOQ',
    bengaliTag: 'বিওকিউ ও এস্টিমেট',
    summary: 'L×W×H takeoff schedule, deductions, CP&OH, VAT & net payable.',
    standardUsed: 'POMI / SMM7 / PWD',
    discipline: 'takeoff-boq',
    icon: FileSpreadsheet,
    moduleId: 'boq-estimator',
  },
  {
    id: 'rate-analysis',
    shortCode: 'BOQ-02',
    title: 'Unit Rate & Cost Analysis',
    bengaliTag: 'রেট অ্যানালাইসিস',
    summary: 'Granular 1 m³ concrete, brickwork & plaster cost breakdowns.',
    standardUsed: 'PWD / CPWD Schedule',
    discipline: 'takeoff-boq',
    icon: Calculator,
    moduleId: 'rate-analysis',
  },
  {
    id: 'concrete-mix',
    shortCode: 'MAT-01',
    title: 'ACI 211.1 Concrete Mix Design',
    bengaliTag: 'কনক্রিট মিক্স ডিজাইন',
    summary: 'Target f\'cr, w/c ratio, absolute volume & 1 m³ trial batch.',
    standardUsed: 'ACI 211.1 / ASTM C143',
    discipline: 'takeoff-boq',
    icon: Boxes,
    moduleId: 'concrete-mix',
  },
  {
    id: 'concrete-materials',
    shortCode: 'MAT-02',
    title: 'Concrete Bags, Sand & Stone',
    bengaliTag: 'সিমেন্ট ও বালি হিসাব',
    summary: 'Exact 50 kg cement bags, sand & stone CFT via 1.54 dry factor.',
    standardUsed: 'Volumetric 1.54 Method',
    discipline: 'takeoff-boq',
    icon: Sparkles,
    moduleId: 'concrete-materials',
  },
  {
    id: 'masonry-finishes',
    shortCode: 'MAT-03',
    title: 'Brick Masonry, Plaster & Paint',
    bengaliTag: 'ইট ও প্লাস্টার হিসাব',
    summary: 'Modular brick count, mortar volume & net plaster excluding openings.',
    standardUsed: 'IS 2212 / BNBC Part 6',
    discipline: 'takeoff-boq',
    icon: Grid,
    moduleId: 'masonry-finishes',
  },
  {
    id: 'unit-converter',
    shortCode: 'UNI-01',
    title: 'Smart Civil & Land Converter',
    bengaliTag: 'ইউনিট কনভার্টার',
    summary: 'Fractional ft-in, suta, CFT, Katha, Decimal & stress units.',
    standardUsed: 'SI / Imperial / BD Regional',
    discipline: 'takeoff-boq',
    icon: ArrowRightLeft,
    moduleId: 'unit-converter',
  },

  // Hydraulics, Pipe & Survey
  {
    id: 'open-channel',
    shortCode: 'HYD-01',
    title: 'Open Channel Manning Solver',
    bengaliTag: 'খাল ও ড্রেন প্রবাহ',
    summary: 'Discharge Q, hydraulic radius, velocity & Froude regime check.',
    standardUsed: 'Manning / Chow Hydraulics',
    discipline: 'hydraulics-survey',
    icon: Waves,
    moduleId: 'open-channel',
  },
  {
    id: 'pipe-hydraulics',
    shortCode: 'HYD-02',
    title: 'Pressurized Pipe Hydraulics',
    bengaliTag: 'পাইপ হাইড্রলিক্স',
    summary: 'Head friction loss, gradient, velocity & Reynolds verification.',
    standardUsed: 'Hazen-Williams / Darcy',
    discipline: 'hydraulics-survey',
    icon: Waves,
    moduleId: 'pipe-hydraulics',
  },
  {
    id: 'earthwork-alignment',
    shortCode: 'EAR-01',
    title: 'Cut/Fill Earthwork & Mass Haul',
    bengaliTag: 'মাটি কাটা ও ভরাট',
    summary: 'Station prismoidal cut/fill volumes & roadway embankment balance.',
    standardUsed: 'Prismoidal / End-Area',
    discipline: 'hydraulics-survey',
    icon: Shovel,
    moduleId: 'earthwork-alignment',
  },
  {
    id: 'surveying-suite',
    shortCode: 'SUR-01',
    title: 'Surveying Leveling & Land Area',
    bengaliTag: 'জরিপ ও লেভেলিং',
    summary: 'HI / Rise-Fall leveling book, Shoelace polygon & Katha/Decimal.',
    standardUsed: 'Rise-Fall / Collimation',
    discipline: 'hydraulics-survey',
    icon: Compass,
    moduleId: 'surveying-suite',
  },

  // Site Management & Field ERP
  {
    id: 'store-inventory',
    shortCode: 'SM-01',
    title: 'Store & Inventory Ledger',
    bengaliTag: 'মালামাল ইন-আউট',
    summary: 'Live stock balances, inward challans, floor issues & BOQ variance.',
    standardUsed: 'Material Control / ERP',
    discipline: 'site-erp',
    icon: Boxes,
    moduleId: 'store-inventory',
  },
  {
    id: 'material-requisition',
    shortCode: 'SM-02',
    title: 'Material Requisition & PO',
    bengaliTag: 'রিকুইজিশন ও অর্ডার',
    summary: 'Multi-item indents, WhatsApp sharing & direct Store receive.',
    standardUsed: 'ISO 9001 Procurement',
    discipline: 'site-erp',
    icon: FileText,
    moduleId: 'material-requisition',
  },
  {
    id: 'schedule-roster',
    shortCode: 'SM-03',
    title: 'Schedule, Curing & Roster',
    bengaliTag: 'কাজের শিডিউল',
    summary: 'Project milestones, concrete curing & de-shuttering calendars.',
    standardUsed: 'ACI 308 / ACI 347',
    discipline: 'site-erp',
    icon: Calendar,
    moduleId: 'schedule-roster',
  },
  {
    id: 'labor-attendance',
    shortCode: 'SM-04',
    title: 'Labor Muster Roll & Wages',
    bengaliTag: 'হাজিরা ও মজুরি',
    summary: '1–31 day Present Book, P/H/OT/A, Khoraki advances & net wages.',
    standardUsed: 'Site Muster Roll',
    discipline: 'site-erp',
    icon: Users,
    moduleId: 'labor-attendance',
  },
  {
    id: 'field-notebook',
    shortCode: 'SM-05',
    title: 'Field Diary & Voice Notes',
    bengaliTag: 'সাইট নোটবুক',
    summary: 'Timestamped grid notes, voice dictation & instruction log.',
    standardUsed: 'Site Diary Protocol',
    discipline: 'site-erp',
    icon: BookOpen,
    moduleId: 'field-notebook',
  },
  {
    id: 'contractor-bills',
    shortCode: 'SM-06',
    title: 'Sub-Contractor RA Bills',
    bengaliTag: 'কন্ট্রাক্টর বিল',
    summary: 'Running Account measurements, retention holding & sign-offs.',
    standardUsed: 'FIDIC / CPWD Billing',
    discipline: 'site-erp',
    icon: Receipt,
    moduleId: 'contractor-bills',
  },
  {
    id: 'petty-cash',
    shortCode: 'SM-07',
    title: 'Site Petty Cash Imprest',
    bengaliTag: 'খুচরা ক্যাশ হিসাব',
    summary: 'Imprest cash balance, debit/credit vouchers & expense rollup.',
    standardUsed: 'Imprest Accounting',
    discipline: 'site-erp',
    icon: Wallet,
    moduleId: 'petty-cash',
  },
  {
    id: 'cube-tests',
    shortCode: 'SM-08',
    title: 'Cube & Cylinder Crushing Log',
    bengaliTag: 'কিউব টেস্ট লগ',
    summary: '7/28-day crushing reminders, DCR compliance & certificates.',
    standardUsed: 'ASTM C39 / BNBC 2020',
    discipline: 'site-erp',
    icon: Layers,
    moduleId: 'cube-tests',
  },
  {
    id: 'daily-progress-report',
    shortCode: 'SM-09',
    title: '1-Click Daily Progress Report',
    bengaliTag: 'ডেইলি প্রগ্রেস রিপোর্ট',
    summary: 'Auto-synthesized attendance, store, weather & cash into A4 DPR.',
    standardUsed: 'Project DPR Protocol',
    discipline: 'site-erp',
    icon: ClipboardCheck,
    moduleId: 'daily-progress-report',
  },
  {
    id: 'office-docs',
    shortCode: 'SM-10',
    title: 'Official Letters & Office Docs',
    bengaliTag: 'অফিসিয়াল চিঠি ও সনদ',
    summary: 'Gate passes, work orders, NCRs & QR-verified completion certs.',
    standardUsed: 'BNBC-2020 / FIDIC',
    discipline: 'site-erp',
    icon: ScrollText,
    moduleId: 'office-docs',
  },

  // Testing Lab & Field QA/QC
  {
    id: 'lab-cement',
    shortCode: 'LAB-01',
    title: 'Cement Quality Tests',
    bengaliTag: 'সিমেন্ট পরীক্ষা',
    summary: 'Adulteration, Vicat consistency/setting, 90µm & soundness.',
    standardUsed: 'BDS EN 197-1 / ASTM C191',
    discipline: 'lab-qaqc',
    icon: FlaskConical,
    moduleId: 'testing-lab-qaqc',
    subAction: 'cement',
  },
  {
    id: 'lab-aggregate',
    shortCode: 'LAB-02',
    title: 'Sand & Aggregate Tests',
    bengaliTag: 'বালি ও পাথর পরীক্ষা',
    summary: '6-sieve FM gradation, silt %, bulking & LA Abrasion value.',
    standardUsed: 'ASTM C136 / C117 / C131',
    discipline: 'lab-qaqc',
    icon: Layers,
    moduleId: 'testing-lab-qaqc',
    subAction: 'aggregate',
  },
  {
    id: 'lab-brick',
    shortCode: 'LAB-03',
    title: 'Brick & Concrete Block Tests',
    bengaliTag: 'ইট ও ব্লক পরীক্ষা',
    summary: 'Compressive crushing, 24h absorption % & efflorescence audit.',
    standardUsed: 'BDS 208 / PWD / ASTM C67',
    discipline: 'lab-qaqc',
    icon: Grid,
    moduleId: 'testing-lab-qaqc',
    subAction: 'brick-block',
  },
  {
    id: 'lab-concrete',
    shortCode: 'LAB-04',
    title: 'Fresh, Hardened Concrete & NDT',
    bengaliTag: 'কনক্রিট ও এনডিটি',
    summary: 'Slump cone, 7/28-day strength, core, Rebound Hammer & UPV.',
    standardUsed: 'ASTM C143 / C39 / C805',
    discipline: 'lab-qaqc',
    icon: Boxes,
    moduleId: 'testing-lab-qaqc',
    subAction: 'concrete-ndt',
  },
  {
    id: 'lab-rebar',
    shortCode: 'LAB-05',
    title: 'Rebar & Steel Lab Tests',
    bengaliTag: 'রডের ল্যাব পরীক্ষা',
    summary: 'UTM yield/UTS ratio, unit weight margin & 180° bend-rebend.',
    standardUsed: 'BDS ISO 6935-2 / ASTM A615',
    discipline: 'lab-qaqc',
    icon: Hammer,
    moduleId: 'testing-lab-qaqc',
    subAction: 'rebar-steel',
  },
  {
    id: 'lab-soil',
    shortCode: 'LAB-06',
    title: 'Soil, Compaction & Pile Tests',
    bengaliTag: 'মাটি ও পাইল টেস্ট',
    summary: 'SPT N60, Atterberg PI, FDD compaction, bentonite & PIT integrity.',
    standardUsed: 'ASTM D1586 / D1556 / D5882',
    discipline: 'lab-qaqc',
    icon: HardHat,
    moduleId: 'testing-lab-qaqc',
    subAction: 'soil-pile',
  },
  {
    id: 'lab-highway',
    shortCode: 'LAB-07',
    title: 'Highway, CBR & Bitumen Tests',
    bengaliTag: 'সড়ক ও বিটুমিন',
    summary: '4-day soaked CBR, DCP, 60/70 bitumen, Marshall & core density.',
    standardUsed: 'RHD / LGED / ASTM D6927',
    discipline: 'lab-qaqc',
    icon: Shovel,
    moduleId: 'testing-lab-qaqc',
    subAction: 'highway-bitumen',
  },
  {
    id: 'lab-water',
    shortCode: 'LAB-08',
    title: 'Water, Plumbing & Ponding',
    bengaliTag: 'পানি ও লিকেজ টেস্ট',
    summary: 'pH/TDS/chloride limit, hydrostatic pipe & 72h ponding test.',
    standardUsed: 'ASTM C1602 / BNBC Part 8',
    discipline: 'lab-qaqc',
    icon: Waves,
    moduleId: 'testing-lab-qaqc',
    subAction: 'water-plumbing',
  },
  {
    id: 'lab-checklists',
    shortCode: 'LAB-09',
    title: 'Field QA/QC Checklists',
    bengaliTag: 'সাইট চেকলিস্ট',
    summary: 'Formwork squareness, seismic cover, curing & masonry verifiers.',
    standardUsed: 'BNBC-2020 / ACI 347R',
    discipline: 'lab-qaqc',
    icon: ClipboardCheck,
    moduleId: 'testing-lab-qaqc',
    subAction: 'site-checklists',
  },
];

export const HomePage: React.FC<HomePageProps> = ({
  activeWorkspace,
  workspaces,
  onSelectModule,
  onOpenWorkspaceManager,
  onOpenProfileModal,
  onOpenArchitectureModal,
  onOpenCadModal,
  onOpenSiteQcModal,
  onOpenPrintPreview,
  onDirectDownloadPdf,
  onOpenCommandPalette,
  onOpenVerifySubmittal,
  onSelectUnitPreset,
  calculationHistory = [],
}) => {
  const civilLab = useCivilLab();
  const workbench = useWorkbench();
  const { siteData } = useSiteManagement();
  const shouldReduceMotion = useReducedMotion();

  // Category & quick filter state
  const [activeDiscipline, setActiveDiscipline] = useState<DisciplineFilterId>('all');
  const [quickFilter, setQuickFilter] = useState('');

  // Quick Feet-Inch & Volume Mini-Converter state (strict 0 baseline on load)
  const [ftInDraft, setFtInDraft] = useState<string>('');
  const [mmValue, setMmValue] = useState<number>(0);
  const [m3Value, setM3Value] = useState<number>(0);
  const [cftValue, setCftValue] = useState<number>(0);

  const handleFtInInputChange = (raw: string) => {
    setFtInDraft(raw);
    const trimmed = raw.trim();
    if (!trimmed) {
      setMmValue(0);
      return;
    }
    const parsed = parseFeetInchString(trimmed);
    if (parsed.isValid) {
      setMmValue(Number(parsed.totalMm.toFixed(2)));
    }
  };

  const handleMmChange = (nextMm: number) => {
    const safeMm = Number.isFinite(nextMm) && nextMm >= 0 ? nextMm : 0;
    setMmValue(safeMm);
    if (safeMm === 0) {
      setFtInDraft('');
    } else {
      setFtInDraft(formatFeetInches(safeMm / 1000, { isMeters: true }));
    }
  };

  const handleM3Change = (nextM3: number) => {
    const safeM3 = Number.isFinite(nextM3) && nextM3 >= 0 ? nextM3 : 0;
    setM3Value(safeM3);
    setCftValue(Number((safeM3 * EXACT_CONVERSION.M3_TO_CFT).toFixed(3)));
  };

  const handleCftChange = (nextCft: number) => {
    const safeCft = Number.isFinite(nextCft) && nextCft >= 0 ? nextCft : 0;
    setCftValue(safeCft);
    setM3Value(Number((safeCft * EXACT_CONVERSION.CFT_TO_M3).toFixed(4)));
  };

  const handleResetMiniConverter = () => {
    setFtInDraft('');
    setMmValue(0);
    setM3Value(0);
    setCftValue(0);
  };

  // Global Unit System toggle handler (keeps WorkbenchContext & Workspace preferences in sync)
  const handleSwitchUnitSystem = (target: GlobalUnitSystem) => {
    workbench.setUnitSystem(target);
    if (onSelectUnitPreset) {
      const preset: UnitSystemPreset =
        target === 'Imperial' ? 'imperial' : target === 'Regional' ? 'regional' : 'metric';
      onSelectUnitPreset(preset);
    }
  };

  // Live BOQ summary
  const boqSummary = useMemo(() => {
    const env = computeBOQEstimator(activeWorkspace.boq);
    return {
      itemCount: activeWorkspace.boq?.items?.length || 0,
      grandTotal: env.result?.grandTotalAmount || 0,
      subtotal: env.result?.subtotalAmount || 0,
      currencySymbol: getCurrencySymbol(activeWorkspace.currency || activeWorkspace.boq?.currency || 'BDT'),
    };
  }, [activeWorkspace.boq, activeWorkspace.currency]);

  // Pinned & Recent Modules resolution
  const quickResumeTools = useMemo(() => {
    const recentEntries = workbench.recentTools
      .map((id) => TOOL_REGISTRY_MAP[id])
      .filter((t): t is ToolRegistryEntry => Boolean(t));

    const pinnedEntries = civilLab.pinnedTools
      .map((id) => TOOL_REGISTRY_MAP[id])
      .filter((t): t is ToolRegistryEntry => Boolean(t));

    const merged: ToolRegistryEntry[] = [];
    const seen = new Set<string>();
    for (const item of [...recentEntries, ...pinnedEntries]) {
      const key = item.moduleId || item.id;
      if (!seen.has(key) && item.moduleId) {
        seen.add(key);
        merged.push(item);
      }
      if (merged.length >= 6) break;
    }
    return merged;
  }, [workbench.recentTools, civilLab.pinnedTools]);

  // Category Counts & Filtered Modules
  const categoryCounts = useMemo(() => {
    const counts: Record<DisciplineFilterId, number> = {
      all: MODULE_LAUNCHPAD_ITEMS.length,
      structural: 0,
      geotechnical: 0,
      'takeoff-boq': 0,
      'hydraulics-survey': 0,
      'site-erp': 0,
      'lab-qaqc': 0,
    };
    for (const item of MODULE_LAUNCHPAD_ITEMS) {
      counts[item.discipline] += 1;
    }
    return counts;
  }, []);

  const filteredModules = useMemo(() => {
    const q = quickFilter.trim().toLowerCase();
    return MODULE_LAUNCHPAD_ITEMS.filter((item) => {
      if (activeDiscipline !== 'all' && item.discipline !== activeDiscipline) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.shortCode.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.standardUsed.toLowerCase().includes(q) ||
        item.bengaliTag.includes(q)
      );
    });
  }, [activeDiscipline, quickFilter]);

  const savedSnapshotsCount = Math.max(calculationHistory.length, civilLab.savedHistory.length);
  const labSavedCount = activeWorkspace.testingLab?.savedRecords?.length || 0;
  const totalLabProcedures = TESTING_LAB_TESTS.length;

  const containerMotion = shouldReduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: 'easeOut' as const },
      };

  const metersReadout = mmValue > 0 ? (mmValue / 1000).toFixed(3) : '0.000';
  const ftInReadout =
    mmValue > 0
      ? formatFeetInches(mmValue / 1000, { isMeters: true })
      : ftInDraft.trim()
      ? 'Check format'
      : `0'-0"`;

  return (
    <motion.div
      {...containerMotion}
      className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-5 pb-20 space-y-6 font-sans"
    >
      {/* =====================================================================
          SECTION A: TOP SMART COMMAND & STATUS HEADER
          ===================================================================== */}
      <section
        aria-label="Home Command Header"
        className="rounded-3xl p-4 sm:p-6 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Explicit Home Title, Project Context & Bilingual Subtitle */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenWorkspaceManager}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer max-w-full"
                title="Switch or Manage Project Workspaces"
              >
                <FolderArchive className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                <span className="font-mono font-bold text-[var(--md-sys-color-primary)] shrink-0">
                  {activeWorkspace.projectCode}
                </span>
                <span className="truncate max-w-[160px] sm:max-w-[240px]">{activeWorkspace.name}</span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] hidden sm:inline shrink-0">
                  ({workspaces.length})
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-0.5">
              <LogoMark size={38} animated={true} className="shrink-0 shadow-xs" />
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--md-sys-color-on-surface)] flex items-baseline gap-2">
                  <span className="flex items-baseline">
                    <span className="text-[var(--md-sys-color-primary)] font-black">BD</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-[2px] bg-amber-500 mx-0.5 mb-0.5 shrink-0" aria-hidden="true" />
                    <span>Civil</span>
                    <span className="text-[var(--md-sys-color-primary)] font-bold">Lab</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                    · Home Dashboard
                  </span>
                </h1>
                <p className="text-[11px] font-mono uppercase tracking-wider font-bold text-[var(--md-sys-color-primary)] mt-0.5">
                  {OFFICIAL_TAGLINE}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Structural analysis, foundation bearing, BOQ takeoff &amp; field ERP.{' '}
              <span className="font-nikosh text-xs opacity-85" lang="bn">
                প্রকৌশল ওয়ার্কবেঞ্চ
              </span>
            </p>
          </div>

          {/* Right: 1-Click Unit Toggle + Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
            {/* Unit System Toggle Pill */}
            <div
              role="group"
              aria-label="Global Unit System"
              className="inline-flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] self-start sm:self-auto"
            >
              <button
                type="button"
                onClick={() => handleSwitchUnitSystem('SI')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer min-h-[34px] whitespace-nowrap ${
                  workbench.unitSystem === 'SI'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Metric SI
              </button>
              <button
                type="button"
                onClick={() => handleSwitchUnitSystem('Imperial')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer min-h-[34px] whitespace-nowrap ${
                  workbench.unitSystem === 'Imperial'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                Imperial ft-in
              </button>
              <button
                type="button"
                onClick={() => handleSwitchUnitSystem('Regional')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer min-h-[34px] whitespace-nowrap ${
                  workbench.unitSystem === 'Regional'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-2xs'
                    : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                }`}
              >
                BD Site
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenPrintPreview || onDirectDownloadPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-semibold transition-opacity cursor-pointer min-h-[40px] whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>Print / Export PDF</span>
              </button>

              {onOpenVerifySubmittal && (
                <button
                  type="button"
                  onClick={onOpenVerifySubmittal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Verify Report</span>
                </button>
              )}

              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={() => onOpenProfileModal('presets')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold transition-colors cursor-pointer min-h-[40px] whitespace-nowrap"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Presets</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search & Command Bar Trigger */}
        <div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (onOpenCommandPalette) onOpenCommandPalette();
              else civilLab.setActivePage('search');
            }}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer group"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <Search className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="text-xs sm:text-sm text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)] truncate">
                Search modules, formulas, or BOQ...
              </span>
            </span>
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)] shrink-0">
              Ctrl+K
            </kbd>
          </button>

          <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono shrink-0 px-1">
            <span>Code:</span>
            <strong className="text-[var(--md-sys-color-on-surface)]">{activeWorkspace.governingCode}</strong>
            <span>·</span>
            <span>Currency:</span>
            <strong className="text-[var(--md-sys-color-on-surface)]">{activeWorkspace.currency}</strong>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION B: LIVE ENGINEERING PULSE & QUICK-UTILITY BENTO STRIP (4 CARDS)
          ===================================================================== */}
      <section aria-label="Live Engineering Pulse" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Pinned & Recent Modules */}
        <div className="rounded-3xl p-4 sm:p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col justify-between gap-3.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Pin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">
                  Pinned &amp; Recent
                </h2>
                <span className="font-nikosh text-[11px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                  দ্রুত চালু
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => civilLab.setActivePage('history')}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer shrink-0 tabular-nums"
              title="Open Saved Calculation History"
            >
              <History className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>{savedSnapshotsCount}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickResumeTools.length === 0 ? (
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] py-2">
                Open any calculator to build your quick-resume bar.
              </p>
            ) : (
              quickResumeTools.slice(0, 4).map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => tool.moduleId && onSelectModule(tool.moduleId, tool.subAction)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-amber-500/50 hover:bg-[var(--md-sys-color-surface-container)] text-xs font-medium text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer max-w-full"
                >
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    {tool.shortCode}
                  </span>
                  <span className="truncate max-w-[120px]">{tool.shortLabel}</span>
                </button>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => civilLab.setActivePage('all')}
              className="text-[var(--md-sys-color-primary)] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Browse All Tools</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
              {civilLab.pinnedTools.length} pinned
            </span>
          </div>
        </div>

        {/* Card 2: Quick Feet-Inch & Unit Mini-Converter */}
        <div className="rounded-3xl p-4 sm:p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col justify-between gap-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">
                  Quick ft-in &amp; Volume
                </h2>
                <span className="font-nikosh text-[11px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                  ফুট-ইঞ্চি ও সিএফটি
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(mmValue > 0 || m3Value > 0 || ftInDraft !== '') && (
                <button
                  type="button"
                  onClick={handleResetMiniConverter}
                  className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                  title="Reset converter to 0 baseline"
                  aria-label="Reset mini converter"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectModule('unit-converter')}
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-sky-500/50 text-sky-600 dark:text-sky-400 cursor-pointer"
              >
                Full
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Length: ft-in <-> mm/m */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  ft-in (e.g. 12&apos;-6&quot;)
                </label>
                <input
                  type="text"
                  value={ftInDraft}
                  onChange={(e) => handleFtInInputChange(e.target.value)}
                  placeholder="0'-0&quot;"
                  aria-label="Feet and inches input"
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Millimeters (mm)
                </label>
                <NumericDraftInput
                  value={mmValue}
                  onChangeValue={handleMmChange}
                  placeholder="0"
                  aria-label="Millimeters input"
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>
            </div>

            {/* Volume: m³ <-> CFT */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Volume (m³)
                </label>
                <NumericDraftInput
                  value={m3Value}
                  onChangeValue={handleM3Change}
                  placeholder="0"
                  aria-label="Cubic meters input"
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Cubic Feet (CFT)
                </label>
                <NumericDraftInput
                  value={cftValue}
                  onChangeValue={handleCftChange}
                  placeholder="0"
                  aria-label="Cubic feet input"
                  className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex items-center justify-between text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
            <span className="truncate">
              {metersReadout} m · {ftInReadout}
            </span>
            <span className="shrink-0">1 m³ = 35.315 CFT</span>
          </div>
        </div>

        {/* Card 3: BOQ & Material Takeoff Summary */}
        <div className="rounded-3xl p-4 sm:p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col justify-between gap-3.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">
                  BOQ &amp; Takeoff
                </h2>
                <span className="font-nikosh text-[11px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                  বিওকিউ ও এস্টিমেট
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0">
              {boqSummary.itemCount} {boqSummary.itemCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
              Estimated Grand Total
            </div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-[var(--md-sys-color-on-surface)] truncate">
              {boqSummary.currencySymbol}{' '}
              {boqSummary.grandTotal.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {boqSummary.itemCount === 0
                ? '0 Baseline — Ready to start itemized quantity takeoff.'
                : `Subtotal ${boqSummary.currencySymbol} ${boqSummary.subtotal.toLocaleString('en-US', { maximumFractionDigits: 0 })} incl. overheads`}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectModule('boq-estimator')}
              className="flex-1 min-h-[36px] px-3 py-1.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors cursor-pointer text-center whitespace-nowrap"
            >
              {boqSummary.itemCount === 0 ? 'Start BOQ' : 'Open BOQ'}
            </button>
            <button
              type="button"
              onClick={() => onSelectModule('rate-analysis')}
              className="min-h-[36px] px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-indigo-500/50 text-[var(--md-sys-color-on-surface)] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Rates
            </button>
          </div>
        </div>

        {/* Card 4: Site ERP & Lab QA/QC Pulse */}
        <div className="rounded-3xl p-4 sm:p-5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col justify-between gap-3.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/25 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">
                  Site ERP &amp; Lab QA/QC
                </h2>
                <span className="font-nikosh text-[11px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                  সাইট ও ল্যাব টেস্ট
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 tabular-nums shrink-0">
              {totalLabProcedures} Tests
            </span>
          </div>

          {/* Compact live site & lab counters */}
          <div className="grid grid-cols-3 gap-2 text-center py-1.5 px-2 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
            <div>
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                {siteData.inventory.length}
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Store</div>
            </div>
            <div className="border-x border-[var(--md-sys-color-outline-variant)]">
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                {siteData.workers.length}
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Workers</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--md-sys-color-on-surface)]">
                {labSavedCount + siteData.cubeTests.length}
              </div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">QC Logs</div>
            </div>
          </div>

          {/* 4 Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onSelectModule('daily-progress-report')}
              className="min-h-[36px] px-2.5 py-1.5 rounded-2xl bg-teal-500/12 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold transition-colors cursor-pointer truncate"
            >
              DPR Report
            </button>
            <button
              type="button"
              onClick={() => onSelectModule('labor-attendance')}
              className="min-h-[36px] px-2.5 py-1.5 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-teal-500/50 text-[var(--md-sys-color-on-surface)] text-xs font-semibold transition-colors cursor-pointer truncate"
            >
              Muster Roll
            </button>
            <button
              type="button"
              onClick={() => onSelectModule('store-inventory')}
              className="min-h-[36px] px-2.5 py-1.5 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-teal-500/50 text-[var(--md-sys-color-on-surface)] text-xs font-semibold transition-colors cursor-pointer truncate"
            >
              Store Stock
            </button>
            <button
              type="button"
              onClick={() => onSelectModule('testing-lab-qaqc')}
              className="min-h-[36px] px-2.5 py-1.5 rounded-2xl bg-rose-500/12 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer truncate"
            >
              Lab QA/QC
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION C: INTERACTIVE CATEGORY FILTER BAR & MODULE LAUNCHPAD
          ===================================================================== */}
      <section aria-label="Engineering Module Launchpad" className="space-y-4">
        {/* Sticky Category Filter Bar */}
        <div className="sticky top-0 z-10 py-2 bg-[var(--md-sys-color-background)]/95 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)]/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {(
                [
                  { id: 'all', label: 'All Modules' },
                  { id: 'structural', label: 'Structural' },
                  { id: 'geotechnical', label: 'Geotechnical' },
                  { id: 'takeoff-boq', label: 'Takeoff & BOQ' },
                  { id: 'hydraulics-survey', label: 'Hydraulics & Survey' },
                  { id: 'site-erp', label: 'Site ERP' },
                  { id: 'lab-qaqc', label: 'Lab QA/QC' },
                ] as Array<{ id: DisciplineFilterId; label: string }>
              ).map((tab) => {
                const isSelected = activeDiscipline === tab.id;
                const activeClasses =
                  tab.id === 'all'
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] border-[var(--md-sys-color-primary)]'
                    : DISCIPLINE_THEMES[tab.id].pillActive;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveDiscipline(tab.id)}
                    aria-pressed={isSelected}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all shrink-0 cursor-pointer min-h-[40px] whitespace-nowrap ${
                      isSelected
                        ? activeClasses
                        : 'bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/10 dark:bg-white/10 tabular-nums">
                      {categoryCounts[tab.id]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Inline Quick Filter */}
            <div className="relative sm:w-60 shrink-0">
              <Search className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                placeholder="Filter modules..."
                aria-label="Filter modules"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)]"
              />
            </div>
          </div>
        </div>

        {/* Module Launchpad Grid */}
        {filteredModules.length === 0 ? (
          <div className="rounded-3xl p-8 border border-dashed border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] text-center space-y-2">
            <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)]">
              No engineering modules match &quot;{quickFilter}&quot;
            </p>
            <button
              type="button"
              onClick={() => {
                setQuickFilter('');
                setActiveDiscipline('all');
              }}
              className="px-4 py-2 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredModules.map((mod) => {
              const Icon = mod.icon;
              const theme = DISCIPLINE_THEMES[mod.discipline];
              const isPinned = civilLab.isToolPinned(mod.id);

              return (
                <div
                  key={mod.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectModule(mod.moduleId, mod.subAction)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectModule(mod.moduleId, mod.subAction);
                    }
                  }}
                  className={`group rounded-3xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] ${theme.hoverBorder} transition-all flex flex-col justify-between gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--md-sys-color-primary)] min-w-0`}
                >
                  <div className="space-y-2.5 min-w-0">
                    {/* Top: Tonal Icon Box + Short Code + Pin Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-[var(--md-sys-color-on-surface-variant)] tabular-nums">
                          {mod.shortCode}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          civilLab.togglePinTool(mod.id);
                        }}
                        className={`p-1.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                          isPinned
                            ? 'text-amber-500 bg-amber-500/15'
                            : 'text-[var(--md-sys-color-on-surface-variant)] opacity-60 hover:opacity-100 hover:bg-[var(--md-sys-color-surface)]'
                        }`}
                        title={isPinned ? 'Unpin from Quick Launch' : 'Pin to Quick Launch'}
                        aria-label={isPinned ? `Unpin ${mod.title}` : `Pin ${mod.title}`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Title + Subtle 2-word Bengali micro-tag */}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors leading-snug">
                        {mod.title}
                      </h3>
                      <span
                        className="font-nikosh text-[11px] text-[var(--md-sys-color-on-surface-variant)] opacity-80 block mt-0.5 truncate"
                        lang="bn"
                      >
                        {mod.bengaliTag}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed line-clamp-2">
                      {mod.summary}
                    </p>
                  </div>

                  {/* Footer: Code Standard + Hover Launch Arrow */}
                  <div className="pt-2.5 border-t border-[var(--md-sys-color-outline-variant)]/60 flex items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {mod.standardUsed}
                    </span>
                    <span className={`inline-flex items-center gap-0.5 font-semibold shrink-0 ${theme.badgeText}`}>
                      <span>Open</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =====================================================================
          SECTION D: ENGINEERING REFERENCE & CAD/EXCEL DOCK (BOTTOM STRIP)
          ===================================================================== */}
      <section aria-label="Engineering Reference and CAD Dock" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
              Reference &amp; Utilities Dock
            </h2>
            <span className="font-nikosh text-xs text-[var(--md-sys-color-on-surface-variant)]" lang="bn">
              বাই-লজ, ক্যাড ও চেকলিস্ট
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Architecture & Building By-Laws Suite */}
          <button
            type="button"
            onClick={() => onOpenArchitectureModal?.('far')}
            className="group text-left rounded-3xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-emerald-500/50 transition-all flex items-start gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                  Architecture &amp; By-Laws
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
              </div>
              <span className="font-nikosh text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                আর্কিটেকচার ও বাই-লজ
              </span>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 line-clamp-2">
                FAR, MGC, setbacks, staircase, water tanks, septic &amp; RWH planner.
              </p>
            </div>
          </button>

          {/* 2. AutoCAD Scale & LISP Hub */}
          <button
            type="button"
            onClick={() => onOpenCadModal?.('viewport')}
            className="group text-left rounded-3xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-sky-500/50 transition-all flex items-start gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/25 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate">
                  AutoCAD Scale &amp; LISP Hub
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
              </div>
              <span className="font-nikosh text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                অটোক্যাড হাব
              </span>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 line-clamp-2">
                Viewport Zoom XP factors, 60+ CAD aliases &amp; AutoLISP routines.
              </p>
            </div>
          </button>

          {/* 3. Civil Excel Formula Library */}
          <button
            type="button"
            onClick={() => onOpenCadModal?.('excel')}
            className="group text-left rounded-3xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-indigo-500/50 transition-all flex items-start gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                  Civil Excel Formula Library
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
              </div>
              <span className="font-nikosh text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                এক্সেল ফর্মুলা
              </span>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 line-clamp-2">
                Copyable interpolation, rebar mass matrices &amp; BOQ S-curve macros.
              </p>
            </div>
          </button>

          {/* 4. Site Inspection Checklists */}
          <button
            type="button"
            onClick={() => onOpenSiteQcModal?.()}
            className="group text-left rounded-3xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] hover:border-rose-500/50 transition-all flex items-start gap-3 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-rose-600 dark:group-hover:text-rose-400 truncate">
                  Site Inspection Checklists
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--md-sys-color-on-surface-variant)] shrink-0" />
              </div>
              <span className="font-nikosh text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] block" lang="bn">
                সাইট চেকলিস্ট
              </span>
              <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 line-clamp-2">
                Pre-pour RCC rebar, slump cone tolerance &amp; 7/28-day QA/QC audits.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Concise Engineering Verification Notice & Platform Channel */}
      <section className="rounded-3xl p-4 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5 text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <strong className="text-[var(--md-sys-color-on-surface)]">Engineering Notice:</strong>{' '}
            Calculations follow BNBC 2020, ACI 318-19, IS 456, AISC 360 &amp; ASTM standards. Always verify final structural &amp; foundation designs with a licensed PE/SE prior to site execution.
          </p>
        </div>

        <a
          href="https://www.facebook.com/BD.CivilLab"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>BD. CivilLab Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </section>
    </motion.div>
  );
};
