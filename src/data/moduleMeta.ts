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
  FlaskConical,
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
    label: 'Project BOQ & Cost',
    shortLabel: 'Project BOQ',
    codeStandard: 'L×W×H Takeoff / Multi-Currency',
    icon: FileSpreadsheet,
  },
  'rate-analysis': {
    label: 'Unit Rate Analysis',
    shortLabel: 'Rate Analysis',
    codeStandard: 'PWD / LGED Composite Rates',
    icon: Calculator,
  },
  'unit-converter': {
    label: 'Unit Converter',
    shortLabel: 'Unit Converter',
    codeStandard: 'SI / BD Site / Feet-Inch',
    icon: Scale,
  },
  'concrete-materials': {
    label: 'Concrete Estimator',
    shortLabel: 'Concrete Estimator',
    codeStandard: 'Bags, CFT & Farrah Box',
    icon: Sparkles,
  },
  'rebar-bbs': {
    label: 'Rebar Schedule (BBS)',
    shortLabel: 'Rebar BBS',
    codeStandard: 'BNBC-2020 / 12m Stock Bar',
    icon: Hammer,
  },
  'masonry-finishes': {
    label: 'Brick, Plaster & Tiles',
    shortLabel: 'Brick & Finishes',
    codeStandard: 'Wall, Opening & RCC Deductions',
    icon: Grid,
  },
  'earthwork-alignment': {
    label: 'Earthwork & Cut-Fill',
    shortLabel: 'Earthwork',
    codeStandard: 'Pit, Plinth Sand & Road Cut-Fill',
    icon: Shovel,
  },
  'beam-analysis': {
    label: 'Beam Analysis',
    shortLabel: 'Beam Analysis',
    codeStandard: 'BNBC-2020 / ACI 318',
    icon: SlidersHorizontal,
  },
  'bearing-capacity': {
    label: 'Footing Bearing',
    shortLabel: 'Footing Bearing',
    codeStandard: 'Terzaghi / Meyerhof',
    icon: HardHat,
  },
  'concrete-mix': {
    label: 'Concrete Mix Design',
    shortLabel: 'Concrete Mix',
    codeStandard: 'ACI 211.1 Volumetric Mix',
    icon: Boxes,
  },
  'open-channel': {
    label: 'Drain & Channel Flow',
    shortLabel: 'Channel Flow',
    codeStandard: 'Manning / Froude',
    icon: Waves,
  },
  'continuous-beam': {
    label: 'Continuous Beam',
    shortLabel: 'Continuous Beam',
    codeStandard: 'Multi-Span BMD & SFD',
    icon: SlidersHorizontal,
  },
  'frame-truss-2d': {
    label: '2D Frame & Truss',
    shortLabel: '2D Frame & Truss',
    codeStandard: 'Stiffness & P-Delta',
    icon: Network,
  },
  'section-analyzer': {
    label: 'Section Properties',
    shortLabel: 'Section Properties',
    codeStandard: 'EC3 / AISC Stress & N-M',
    icon: Layers,
  },
  'rc-column-design': {
    label: 'Column Design',
    shortLabel: 'Column Design',
    codeStandard: 'BNBC-2020 / ACI 318 P-M',
    icon: Columns2,
  },
  'strut-and-tie': {
    label: 'Deep Beam & Corbel (STM)',
    shortLabel: 'Deep Beam (STM)',
    codeStandard: 'ACI 318 Ch. 23 Strut & Tie',
    icon: Triangle,
  },
  'pile-capacity': {
    label: 'Pile Capacity',
    shortLabel: 'Pile Capacity',
    codeStandard: 'SPT-N / Alpha & Beta Method',
    icon: HardHat,
  },
  'pipe-hydraulics': {
    label: 'Pipe Flow & Pressure',
    shortLabel: 'Pipe Flow',
    codeStandard: 'Hazen-Williams / Head Loss',
    icon: Waves,
  },
  'surveying-suite': {
    label: 'Land Survey & Leveling',
    shortLabel: 'Land Survey',
    codeStandard: 'Level Book & Land Area',
    icon: Compass,
  },
  'store-inventory': {
    label: 'Store Inventory',
    shortLabel: 'Store Inventory',
    codeStandard: 'Stock In/Out & BOQ Balance',
    icon: Package,
  },
  'material-requisition': {
    label: 'Purchase & Requisition',
    shortLabel: 'Requisitions',
    codeStandard: 'Site Indents & PO Slip',
    icon: FileText,
  },
  'schedule-roster': {
    label: 'Work Schedule & Curing',
    shortLabel: 'Work Schedule',
    codeStandard: 'Milestones & Curing Calendar',
    icon: Calendar,
  },
  'labor-attendance': {
    label: 'Labor & Wages',
    shortLabel: 'Labor & Wages',
    codeStandard: 'Muster Roll & Daily Pay',
    icon: Users,
  },
  'field-notebook': {
    label: 'Site Diary & Notes',
    shortLabel: 'Site Diary',
    codeStandard: 'Field Log & Grid Notes',
    icon: BookOpen,
  },
  'contractor-bills': {
    label: 'Contractor Bills',
    shortLabel: 'Contractor Bills',
    codeStandard: 'RA Bills & Retention',
    icon: Receipt,
  },
  'petty-cash': {
    label: 'Site Petty Cash',
    shortLabel: 'Petty Cash',
    codeStandard: 'Daily Expense & Vouchers',
    icon: Wallet,
  },
  'cube-tests': {
    label: 'Cube Strength Log',
    shortLabel: 'Cube Strength',
    codeStandard: '7 & 28-Day Crushing Register',
    icon: Layers,
  },
  'daily-progress-report': {
    label: 'Daily Report (DPR)',
    shortLabel: 'Daily Report',
    codeStandard: '1-Click Site Summary',
    icon: ClipboardCheck,
  },
  'office-docs': {
    label: 'Letters & Gate Pass',
    shortLabel: 'Letters & Docs',
    codeStandard: 'Work Orders, Gate Pass & NCR',
    icon: ScrollText,
  },
  'testing-lab-qaqc': {
    label: 'Lab & Quality Checks',
    shortLabel: 'Lab & QA/QC',
    codeStandard: 'BNBC-2020 / PWD / LGED / ASTM',
    icon: FlaskConical,
  },
};
