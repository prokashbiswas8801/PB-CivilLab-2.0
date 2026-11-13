import React from 'react';
import {
  FileSpreadsheet,
  Calculator,
  Scale,
  Sparkles,
  Hammer,
  Grid,
  Shovel,
  SlidersHorizontal,
  HardHat,
  Boxes,
  Waves,
  Compass,
  Package,
  FileText,
  Calendar,
  Users,
  BookOpen,
  Receipt,
  Wallet,
  Layers,
  ClipboardCheck,
  ScrollText,
  Network,
  Columns2,
  Triangle,
} from 'lucide-react';
import { EngineeringModuleId } from '../types/civil';

export interface ModuleMetadataItem {
  label: string;
  shortLabel: string;
  codeStandard: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MODULE_META: Record<EngineeringModuleId, ModuleMetadataItem> = {
  'boq-estimator': {
    label: 'Quantity Takeoff & BOQ Estimator',
    shortLabel: 'BOQ Estimator',
    codeStandard: 'L×W×H Takeoff / Multi-Currency',
    icon: FileSpreadsheet,
  },
  'rate-analysis': {
    label: 'Granular Unit Rate Analysis',
    shortLabel: 'Rate Analysis',
    codeStandard: '1 m³ RCC & Trades Composite',
    icon: Calculator,
  },
  'unit-converter': {
    label: 'Smart Unit & Feet-Inch Engine',
    shortLabel: 'Unit Converter',
    codeStandard: 'Universal / Regional / Feet-Inch',
    icon: Scale,
  },
  'concrete-materials': {
    label: 'Material & Concrete Tech',
    shortLabel: 'Material & Mix',
    codeStandard: 'BNBC / ACI / IS',
    icon: Sparkles,
  },
  'rebar-bbs': {
    label: 'Structural RCC & Rebar BBS',
    shortLabel: 'Rebar BBS',
    codeStandard: 'Exact Density / Bend Ded.',
    icon: Hammer,
  },
  'masonry-finishes': {
    label: 'Masonry, Plaster & Tiles',
    shortLabel: 'Masonry & Tiles',
    codeStandard: 'Opening Deductions',
    icon: Grid,
  },
  'earthwork-alignment': {
    label: 'Earthwork & Prismoidal Alignment',
    shortLabel: 'Earthwork & Road',
    codeStandard: 'Bulking Swell / Prismoidal',
    icon: Shovel,
  },
  'beam-analysis': {
    label: 'Structural Beam Analysis',
    shortLabel: 'Beam Flexure',
    codeStandard: 'AISC 360 / Eurocode 3',
    icon: SlidersHorizontal,
  },
  'bearing-capacity': {
    label: 'Shallow Foundation Bearing',
    shortLabel: 'Geotech Bearing',
    codeStandard: 'Terzaghi / Meyerhof',
    icon: HardHat,
  },
  'concrete-mix': {
    label: 'ACI 211.1 Mix Proportioning',
    shortLabel: 'ACI Mix Design',
    codeStandard: 'Absolute Volume',
    icon: Boxes,
  },
  'open-channel': {
    label: 'Open-Channel Hydraulics',
    shortLabel: 'Hydraulics',
    codeStandard: 'Manning / Froude',
    icon: Waves,
  },
  'continuous-beam': {
    label: 'Continuous Beam Analysis',
    shortLabel: 'Continuous Beam',
    codeStandard: 'Three-Moment / BMD & SFD',
    icon: SlidersHorizontal,
  },
  'frame-truss-2d': {
    label: '2D Frame & Truss Solver + P-Delta',
    shortLabel: '2D Frame & Truss',
    codeStandard: 'Direct Stiffness / 2nd-Order P-Δ',
    icon: Network,
  },
  'section-analyzer': {
    label: 'Section Stresses & Plastic N-M Interaction',
    shortLabel: 'Section Analyzer',
    codeStandard: 'Eurocode 3 Class 1–4 / AISC 360',
    icon: Layers,
  },
  'rc-column-design': {
    label: 'RC Column N-M Interaction & Slenderness',
    shortLabel: 'RC Column Design',
    codeStandard: 'BNBC-2020 / ACI 318-19 / Eurocode 2',
    icon: Columns2,
  },
  'strut-and-tie': {
    label: 'Strut-and-Tie Model (STM) Solver',
    shortLabel: 'Strut & Tie STM',
    codeStandard: 'ACI 318-19 Ch. 23 / BNBC-2020 (Partial)',
    icon: Triangle,
  },
  'pile-capacity': {
    label: 'Deep Pile Foundation Bearing',
    shortLabel: 'Pile Capacity',
    codeStandard: 'BNBC-2020 / Tomlinson α & β',
    icon: HardHat,
  },
  'pipe-hydraulics': {
    label: 'Pipe Pressure & Storm Flow',
    shortLabel: 'Pipe Hydraulics',
    codeStandard: 'Hazen-Williams / Reynolds',
    icon: Waves,
  },
  'surveying-suite': {
    label: 'Surveying & Land Measurement Suite',
    shortLabel: 'Surveying Suite',
    codeStandard: 'Heron / Shoelace / Differential Leveling',
    icon: Compass,
  },
  'store-inventory': {
    label: 'Store & Inventory Ledger',
    shortLabel: 'Store Ledger',
    codeStandard: 'Challan Gate Pass / Issue Logs',
    icon: Package,
  },
  'material-requisition': {
    label: 'Material Requisition & PO Generator',
    shortLabel: 'Requisitions',
    codeStandard: 'Multi-Item Indents / WhatsApp PO',
    icon: FileText,
  },
  'schedule-roster': {
    label: 'Project Schedule & Engineer Roster',
    shortLabel: 'Schedule & Roster',
    codeStandard: 'Pour Curing / Deshutter & QA/QC',
    icon: Calendar,
  },
  'labor-attendance': {
    label: 'Present Book & Labor Wage Sheet',
    shortLabel: 'Labor Muster Roll',
    codeStandard: 'Daily Headcount / Khoraki & Wages',
    icon: Users,
  },
  'field-notebook': {
    label: 'Smart Engineering Field Notebook',
    shortLabel: 'Field Diary',
    codeStandard: 'Voice Dictation / Grid Directives',
    icon: BookOpen,
  },
  'contractor-bills': {
    label: 'Sub-Contractor RA Bill Tracker',
    shortLabel: 'RA Bills',
    codeStandard: 'Cumulative Joint Measurements / Retention',
    icon: Receipt,
  },
  'petty-cash': {
    label: 'Site Petty Cash & Imprest Register',
    shortLabel: 'Petty Cash',
    codeStandard: 'Cash In Hand / Expense Vouchers',
    icon: Wallet,
  },
  'cube-tests': {
    label: 'Concrete Pour & Cube/Cylinder Tests',
    shortLabel: 'Cube Register',
    codeStandard: '7-Day & 28-Day Strength DCR',
    icon: Layers,
  },
  'daily-progress-report': {
    label: 'Master Daily Progress Report (DPR)',
    shortLabel: 'DPR Generator',
    codeStandard: '1-Click Multi-Source Site Synthesis',
    icon: ClipboardCheck,
  },
  'office-docs': {
    label: 'Official Letters & Office Docs Generator',
    shortLabel: 'Office Docs',
    codeStandard: 'Bilingual Formal Engineering Contracts & Notices',
    icon: ScrollText,
  },
};
