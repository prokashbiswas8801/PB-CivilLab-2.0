import { EngineeringModuleId } from '../types/civil';

export type ToolDiscipline =
  | 'Structural'
  | 'Geotechnical'
  | 'BOQ & Takeoff'
  | 'Materials & Mix'
  | 'Hydraulics & Drainage'
  | 'Earthwork & Surveying'
  | 'Architecture & By-Laws'
  | 'CAD & Utilities'
  | 'Site QC & Field'
  | 'Site Management & ERP';

export interface ToolRegistryEntry {
  id: string;
  moduleId?: EngineeringModuleId;
  title: string;
  shortLabel: string;
  shortCode: string; // e.g. STR-01, GEO-02, ARC-01
  category: ToolDiscipline;
  subCategory: string;
  keywords: string[];
  standardUsed: string;
  description: string;
  modalType?: 'architecture' | 'cad' | 'site-qc';
  modalTab?: string;
}

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  // 1. STRUCTURAL (STR)
  {
    id: 'beam-analysis',
    moduleId: 'beam-analysis',
    title: 'RC Beam Flexure, Shear & Deflection Solver',
    shortLabel: 'RC Beam Analysis',
    shortCode: 'STR-01',
    category: 'Structural',
    subCategory: 'Flexure & Shear',
    keywords: ['beam', 'moment', 'shear', 'deflection', 'bending', 'udl', 'point load', 'span', 'stress', 'str-01'],
    standardUsed: 'ACI 318-19 / BNBC 2020 / IS 456',
    description: 'Calculates bending moments, shear diagrams, extreme flexural stress, and L/360 serviceability deflection for simply-supported and cantilever beams.',
  },
  {
    id: 'continuous-beam',
    moduleId: 'continuous-beam',
    title: 'Continuous Beam Multi-Span FEM Solver',
    shortLabel: 'Continuous Beam',
    shortCode: 'STR-02',
    category: 'Structural',
    subCategory: 'Multi-Span Analysis',
    keywords: ['continuous', 'multi-span', 'stiffness', 'matrix', 'fem', 'hogging', 'sagging', 'moments', 'str-02'],
    standardUsed: 'Direct Stiffness Method / ACI 318',
    description: 'Matrix structural analysis for 3-span continuous beams with support settlements, rotational stiffness, and envelope shear.',
  },
  {
    id: 'rebar-bbs',
    moduleId: 'rebar-bbs',
    title: 'Rebar BBS & Bar Bending Schedule Engine',
    shortLabel: 'Rebar BBS Schedule',
    shortCode: 'STR-03',
    category: 'Structural',
    subCategory: 'Reinforcement Detailing',
    keywords: ['rebar', 'bbs', 'bar bending', 'steel', 'weight', 'lap splice', 'cutting length', 'hook', 'stirrup', 'str-03'],
    standardUsed: 'BS 8666 / SP 34 / BNBC 2020',
    description: 'Generates ISO cutting lengths, bend deductions, d²/162 unit weight calculation, tension lap splice lengths, and tonnage summaries.',
  },

  // 2. GEOTECHNICAL (GEO)
  {
    id: 'bearing-capacity',
    moduleId: 'bearing-capacity',
    title: 'Shallow Footing Bearing Capacity & Settlement',
    shortLabel: 'Bearing Capacity',
    shortCode: 'GEO-01',
    category: 'Geotechnical',
    subCategory: 'Shallow Foundations',
    keywords: ['bearing', 'soil', 'foundation', 'footing', 'terzaghi', 'meyerhof', 'cohesion', 'friction', 'kpa', 'geo-01'],
    standardUsed: 'Terzaghi / Meyerhof / BNBC 2020',
    description: 'Evaluates ultimate and safe allowable bearing pressures (q_u, q_all) with Terzaghi bearing factors (Nc, Nq, Nγ) and safety factor verification.',
  },
  {
    id: 'pile-capacity',
    moduleId: 'pile-capacity',
    title: 'Deep Foundation Driven & Bored Pile Capacity',
    shortLabel: 'Pile Capacity',
    shortCode: 'GEO-02',
    category: 'Geotechnical',
    subCategory: 'Deep Foundations',
    keywords: ['pile', 'deep foundation', 'bored', 'driven', 'skin friction', 'end bearing', 'spt', 'meyerhof', 'alpha', 'geo-02'],
    standardUsed: 'Meyerhof SPT / Alpha Method / BNBC 2020',
    description: 'Computes skin resistance and base end-bearing through multi-layered soil profiles with SPT-N blow count correlations.',
  },

  // 3. BOQ & QUANTITY TAKEOFF (BOQ)
  {
    id: 'boq-estimator',
    moduleId: 'boq-estimator',
    title: 'Quantity Takeoff & Bill of Quantities (BOQ)',
    shortLabel: 'BOQ Estimator',
    shortCode: 'BOQ-01',
    category: 'BOQ & Takeoff',
    subCategory: 'Cost Estimation',
    keywords: ['boq', 'takeoff', 'estimate', 'bill of quantities', 'cost', 'contingency', 'vat', 'tender', 'boq-01'],
    standardUsed: 'POMI / Standard Method of Measurement (SMM7)',
    description: 'Itemized L×W×H takeoff schedule with deductions, contractor margin, taxes, contingency allowances, and multi-currency formatting.',
  },
  {
    id: 'rate-analysis',
    moduleId: 'rate-analysis',
    title: 'Granular Unit Rate & Composite Cost Analysis',
    shortLabel: 'Rate Analysis',
    shortCode: 'BOQ-02',
    category: 'BOQ & Takeoff',
    subCategory: 'Cost Breakdown',
    keywords: ['rate', 'analysis', 'labor', 'equipment', 'material', 'prime cost', 'contractor profit', 'pwd', 'boq-02'],
    standardUsed: 'CPWD / PWD Schedule of Rates',
    description: 'Breaks down 1 m³ composite concrete, brickwork, and plastering costs into raw materials, mason/labor hours, and overhead.',
  },

  // 4. MATERIALS & MIX DESIGN (MAT)
  {
    id: 'concrete-mix',
    moduleId: 'concrete-mix',
    title: 'ACI 211.1 Volumetric Concrete Mix Design',
    shortLabel: 'Concrete Mix Design',
    shortCode: 'MAT-01',
    category: 'Materials & Mix',
    subCategory: 'Mix Proportioning',
    keywords: ['mix', 'concrete', 'aci 211', 'w/c', 'slump', 'cement', 'aggregate', 'target strength', 'fcr', 'mat-01'],
    standardUsed: 'ACI 211.1 / ASTM C143',
    description: 'Target mean compressive strength f\'cr, water-cement ratio curve, absolute volume law, and 1 m³ trial batch formulations.',
  },
  {
    id: 'concrete-materials',
    moduleId: 'concrete-materials',
    title: 'Concrete Bulk Technology & Bag Estimator',
    shortLabel: 'Concrete Materials',
    shortCode: 'MAT-02',
    category: 'Materials & Mix',
    subCategory: 'Bulk Quantities',
    keywords: ['cement bags', 'sand', 'coarse aggregate', 'dry volume', '1.54 factor', 'cft', 'm3', 'mat-02'],
    standardUsed: 'Volumetric Method (1.54 Dry Factor)',
    description: 'Calculates exact 50kg cement bag demand, sand CFT, and coarse aggregate CFT from wet RCC volumes using the 1.54 dry expansion factor.',
  },
  {
    id: 'masonry-finishes',
    moduleId: 'masonry-finishes',
    title: 'Brick Masonry, Plaster & Wall Finishes Takeoff',
    shortLabel: 'Masonry & Plaster',
    shortCode: 'MAT-03',
    category: 'Materials & Mix',
    subCategory: 'Architectural Finishes',
    keywords: ['brick', 'mortar', 'plaster', 'wall', 'pointing', 'finishes', 'paint', 'openings', 'mat-03'],
    standardUsed: 'IS 2212 / BNBC 2020 Part 6',
    description: 'Calculates modular brick count with frog deductions, dry mortar requirements, and 2-side net plaster area excluding window/door openings.',
  },

  // 5. HYDRAULICS & DRAINAGE (HYD)
  {
    id: 'open-channel',
    moduleId: 'open-channel',
    title: 'Open Channel Flow Hydraulics (Manning Solver)',
    shortLabel: 'Open Channel Flow',
    shortCode: 'HYD-01',
    category: 'Hydraulics & Drainage',
    subCategory: 'Surface Drainage',
    keywords: ['channel', 'manning', 'discharge', 'culvert', 'drain', 'froude', 'hydraulic radius', 'velocity', 'hyd-01'],
    standardUsed: 'Manning Formulation / Chow Open-Channel Hydraulics',
    description: 'Solves discharge capacity Q, flow velocity, wetted perimeter, hydraulic radius, and subcritical/supercritical Froude regime in trapezoidal and rectangular drains.',
  },
  {
    id: 'pipe-hydraulics',
    moduleId: 'pipe-hydraulics',
    title: 'Pressurized Pipe & Storm Conduits Solver',
    shortLabel: 'Pipe Hydraulics',
    shortCode: 'HYD-02',
    category: 'Hydraulics & Drainage',
    subCategory: 'Pipe Networks',
    keywords: ['pipe', 'pressure', 'hazen-williams', 'head loss', 'friction', 'reynolds', 'flow rate', 'pvc', 'hyd-02'],
    standardUsed: 'Hazen-Williams / Darcy-Weisbach',
    description: 'Calculates head friction loss, hydraulic gradient, flow velocity, and Reynolds number across PVC, HDPE, ductile iron, and concrete pipelines.',
  },

  // 6. EARTHWORK & SURVEYING (EAR / SUR)
  {
    id: 'earthwork-alignment',
    moduleId: 'earthwork-alignment',
    title: 'Roadway Alignment Cut/Fill Earthwork & Mass Haul',
    shortLabel: 'Earthwork Cut & Fill',
    shortCode: 'EAR-01',
    category: 'Earthwork & Surveying',
    subCategory: 'Earth Moving',
    keywords: ['earthwork', 'cut', 'fill', 'embankment', 'road', 'formation', 'prismoidal', 'cross section', 'ear-01'],
    standardUsed: 'Prismoidal Formulation / Average End-Area',
    description: 'Computes progressive station cut/fill volumes, prismoidal correction, and net mass-haul balance across trapezoidal roadway embankments.',
  },
  {
    id: 'surveying-suite',
    moduleId: 'surveying-suite',
    title: 'Surveying Field Computations & Leveling Book',
    shortLabel: 'Surveying Suite',
    shortCode: 'SUR-01',
    category: 'Earthwork & Surveying',
    subCategory: 'Geomatics & Leveling',
    keywords: ['survey', 'leveling', 'hi method', 'rise fall', 'heron', 'land area', 'traverse', 'katha', 'decimal', 'sur-01'],
    standardUsed: 'Rise & Fall / Collimation Height / Shoelace Theorem',
    description: 'Rise & Fall and HI Leveling Sheet with arithmetic self-check, irregular polygon land area (Heron & Shoelace), and regional land parcel conversion.',
  },

  // 7. UNITS & CONVERSIONS (UNI)
  {
    id: 'unit-converter',
    moduleId: 'unit-converter',
    title: 'Civil & Architectural Smart Unit Converter',
    shortLabel: 'Smart Unit Converter',
    shortCode: 'UNI-01',
    category: 'BOQ & Takeoff',
    subCategory: 'Unit Engine',
    keywords: ['unit', 'converter', 'feet inch', 'fractions', 'metric', 'imperial', 'cft', 'katha', 'mpa', 'psi', 'uni-01'],
    standardUsed: 'SI / US Customary / Regional Standards',
    description: 'High-precision converter supporting fractional architectural feet-inch strings (12\'-4 1/2"), pressure, stress, CFT, and regional South Asian land parcels.',
  },

  // 8. ARCHITECTURE & BUILDING BY-LAWS (ARC)
  {
    id: 'architecture-far',
    title: 'Floor Area Ratio (FAR) & Max Built-up Area',
    shortLabel: 'FAR By-Laws',
    shortCode: 'ARC-01',
    category: 'Architecture & By-Laws',
    subCategory: 'Urban Planning',
    keywords: ['far', 'floor area ratio', 'setbacks', 'coverage', 'mgc', 'building by-laws', 'rajuk', 'dap', 'arc-01'],
    standardUsed: 'BNBC 2020 Part 3 / RAJUK DAP / NBC',
    description: 'Calculates maximum allowable gross construction area, Maximum Ground Coverage (MGC), and front/rear/side setbacks based on road width and plot size.',
    modalType: 'architecture',
    modalTab: 'far',
  },
  {
    id: 'architecture-staircase',
    title: 'Building Staircase Riser & Tread Dimensioning',
    shortLabel: 'Staircase By-Laws',
    shortCode: 'ARC-02',
    category: 'Architecture & By-Laws',
    subCategory: 'Circulation',
    keywords: ['staircase', 'riser', 'tread', 'headroom', 'flight', 'handrail', 'blondel', 'arc-02'],
    standardUsed: 'Blondel Formula 2R+T=600mm / BNBC',
    description: 'Validates commercial and residential staircase slope, flight count, landing width, and minimum clear headroom according to building codes.',
    modalType: 'architecture',
    modalTab: 'staircase',
  },
  {
    id: 'architecture-watertank',
    title: 'Underground & Overhead Water Reservoir Sizing',
    shortLabel: 'Water Tank Sizing',
    shortCode: 'ARC-03',
    category: 'Architecture & By-Laws',
    subCategory: 'Plumbing & Storage',
    keywords: ['water tank', 'reservoir', 'ugwr', 'ohwr', 'liters', 'gallons', 'occupants', 'plumbing', 'arc-03'],
    standardUsed: 'BNBC 2020 Part 8 / IS 1172',
    description: 'Calculates 24-48h domestic and fire reserve storage requirements based on building occupancy type and per capita consumption.',
    modalType: 'architecture',
    modalTab: 'watertank',
  },
  {
    id: 'architecture-septictank',
    title: 'Septic Tank & Soak Pit Dimensioning Engine',
    shortLabel: 'Septic Tank Design',
    shortCode: 'ARC-04',
    category: 'Architecture & By-Laws',
    subCategory: 'Sanitary Engineering',
    keywords: ['septic tank', 'soak pit', 'effluent', 'sludge', 'retention period', 'sewage', 'sanitary', 'arc-04'],
    standardUsed: 'BNBC 2020 Part 8 / IS 2470',
    description: 'Dimensions multi-chamber septic tanks and effluent soak pits with sludge accumulation rate and minimum liquid depth verification.',
    modalType: 'architecture',
    modalTab: 'septictank',
  },

  // 9. CAD SHORTCUTS & UTILITIES (CAD)
  {
    id: 'cad-viewport',
    title: 'AutoCAD Layout Viewport Scale & Zoom XP Factors',
    shortLabel: 'CAD Viewport Scales',
    shortCode: 'CAD-01',
    category: 'CAD & Utilities',
    subCategory: 'Drafting Tools',
    keywords: ['cad', 'viewport', 'scale', 'zoom xp', 'autocad', 'paperspace', 'modelspace', '1:100', '1:50', 'cad-01'],
    standardUsed: 'Standard Metric ISO Drawing Scales',
    description: 'Computes exact Zoom XP scale factors for 1:50, 1:100, 1:200 architectural and structural drawing sheets in millimeter PaperSpace.',
    modalType: 'cad',
    modalTab: 'viewport',
  },
  {
    id: 'cad-shortcuts',
    title: 'AutoCAD Professional Command Aliases & Shortcuts',
    shortLabel: 'CAD Shortcuts Hub',
    shortCode: 'CAD-02',
    category: 'CAD & Utilities',
    subCategory: 'Speed Drafting',
    keywords: ['autocad', 'shortcuts', 'aliases', 'commands', 'acad.pgp', 'lisp', 'drafting', 'cad-02'],
    standardUsed: 'AutoCAD Native Shortcut Registry',
    description: 'Searchable cheat-sheet of 60+ critical engineering AutoCAD commands, keyboard aliases, and OSNAP/ortho toggles.',
    modalType: 'cad',
    modalTab: 'shortcuts',
  },
  {
    id: 'cad-excel',
    title: 'Structural Engineering Excel & Spreadsheet Formulas',
    shortLabel: 'Excel Formula Hub',
    shortCode: 'CAD-03',
    category: 'CAD & Utilities',
    subCategory: 'Spreadsheets',
    keywords: ['excel', 'formulas', 'vlookup', 'xlookup', 'index match', 'interpolation', 'bbs formula', 'cad-03'],
    standardUsed: 'ISO Structural Calc Sheet Standards',
    description: 'Formulas for linear stress interpolation, bar bending mass matrices, and dynamic BOQ aggregation in Excel.',
    modalType: 'cad',
    modalTab: 'excel',
  },

  // 10. SITE QC & FIELD PROTOCOLS (QCS)
  {
    id: 'site-qc-protocols',
    title: 'Site Quality Control (Slump, Cubes, Rebar & Concrete)',
    shortLabel: 'Site QC Protocols',
    shortCode: 'QCS-01',
    category: 'Site QC & Field',
    subCategory: 'Field QA/QC',
    keywords: ['qc', 'quality control', 'slump test', 'cube test', 'cylinder test', 'pre-pour', 'inspection checklist', 'qcs-01'],
    standardUsed: 'ASTM C143 / ASTM C39 / BNBC 2020 Part 2',
    description: 'Interactive checklists for pre-pour rebar inspection, slump tolerance verification, and 7/28-day cylinder compressive strength criteria.',
    modalType: 'site-qc',
  },

  // 11. SITE MANAGEMENT & FIELD ERP (SM-01 to SM-09)
  {
    id: 'store-inventory',
    moduleId: 'store-inventory',
    title: 'Site Store Ledger & Materials Inventory (মালামাল ইন-আউট)',
    shortLabel: 'Store & Inventory Ledger',
    shortCode: 'SM-01',
    category: 'Site Management & ERP',
    subCategory: 'Store & Logistics',
    keywords: ['store', 'inventory', 'stock', 'challan', 'gate pass', 'cement', 'steel', 'sand', 'inward', 'outward', 'মালামাল', 'ইনভেন্টরি', 'sm-01', 'erp-01'],
    standardUsed: 'Construction Material Control & BOQ Variance',
    description: 'Tracks live material store balances, inward challan deliveries (মালামাল জমা), outward floor issues (মালামাল খরচ), and theoretical BOQ variance.',
  },
  {
    id: 'material-requisition',
    moduleId: 'material-requisition',
    title: 'Material Requisition Slip & PO Generator (রিকুইজিশন)',
    shortLabel: 'Material Requisitions & PO',
    shortCode: 'SM-02',
    category: 'Site Management & ERP',
    subCategory: 'Procurement & Indents',
    keywords: ['requisition', 'purchase order', 'po', 'indent', 'material request', 'whatsapp', 'procurement', 'রিকুইজিশন', 'অর্ডার', 'sm-02', 'erp-02'],
    standardUsed: 'Construction Site Purchase Indents / ISO 9001 Procurement',
    description: 'Generates multi-item material requisition slips with real-time store balances, 1-click WhatsApp copy, A4 PDF slips, and auto-receive into Store.',
  },
  {
    id: 'schedule-roster',
    moduleId: 'schedule-roster',
    title: 'Project Construction Schedule & Engineer Roster (শিডিউল)',
    shortLabel: 'Schedule & Curing Roster',
    shortCode: 'SM-03',
    category: 'Site Management & ERP',
    subCategory: 'Scheduling & QA/QC',
    keywords: ['schedule', 'milestones', 'casting', 'curing', 'deshuttering', 'props', 'engineer roster', 'inspections', 'শিডিউল', 'কিউরিং', 'sm-03', 'erp-03'],
    standardUsed: 'ACI 308 Curing / ACI 347 Formwork De-shuttering',
    description: 'Manages construction progress milestones, Smart Concrete Casting Curing & De-shuttering calendars, and engineer daily inspection checklists.',
  },
  {
    id: 'labor-attendance',
    moduleId: 'labor-attendance',
    title: 'Muster Roll Labor Attendance & Wage Manager (লেবার হাজিরা ও মজুরি)',
    shortLabel: 'Labor Attendance & Wages',
    shortCode: 'SM-04',
    category: 'Site Management & ERP',
    subCategory: 'Labor & Payroll',
    keywords: ['labor', 'attendance', 'muster roll', 'wages', 'khoraki', 'overtime', 'head mason', 'jogali', 'hajira khata', 'হাজিরা', 'মজুরি', 'লেবার', 'sm-04', 'erp-04'],
    standardUsed: 'South Asian Construction Muster Roll & Daily Wage Practices',
    description: 'Full-month 1-31 days Present Book (হাজিরা খাতা), trade category directory, P/H/OT/A marking, Khoraki advances, and automated net wage calculations.',
  },
  {
    id: 'field-notebook',
    moduleId: 'field-notebook',
    title: 'Smart Engineering Field Diary & Instructions Log (সাইট নোটবুক)',
    shortLabel: 'Field Diary & Voice Notes',
    shortCode: 'SM-05',
    category: 'Site Management & ERP',
    subCategory: 'Site Documentation',
    keywords: ['field notes', 'diary', 'site notebook', 'voice notes', 'dictation', 'grid location', 'instructions', 'architect orders', 'নোটবুক', 'ডায়েরি', 'sm-05', 'erp-05'],
    standardUsed: 'Standard Engineering Site Diary Protocol',
    description: 'Structured site notebook with date/time, #Grid tags, speech-to-text voice dictation, priority tags, and client/architect instruction logs.',
  },
  {
    id: 'contractor-bills',
    moduleId: 'contractor-bills',
    title: 'Sub-Contractor RA Bill & Measurement Tracker (কন্ট্রাক্টর বিল)',
    shortLabel: 'Subcontractor RA Bills',
    shortCode: 'SM-06',
    category: 'Site Management & ERP',
    subCategory: 'Billing & Contracts',
    keywords: ['ra bill', 'running account', 'contractor bill', 'measurement', 'retention', 'security money', 'advance deduction', 'কন্ট্রাক্টর', 'বিল', 'sm-06', 'erp-06'],
    standardUsed: 'Standard FIDIC / CPWD Sub-Contractor Measurement Billing',
    description: 'Sequential Running Account (RA) Certification with cumulative measurements, security retention holding, and 3-tier authorization sign-offs.',
  },
  {
    id: 'petty-cash',
    moduleId: 'petty-cash',
    title: 'Site Petty Cash & Daily Expense Imprest Register (খুচরা ক্যাশ হিসাব)',
    shortLabel: 'Site Petty Cash Ledger',
    shortCode: 'SM-07',
    category: 'Site Management & ERP',
    subCategory: 'Site Finance',
    keywords: ['petty cash', 'imprest', 'daily expenses', 'site cash', 'vouchers', 'cash in hand', 'receipts', 'ক্যাশ', 'পেটি ক্যাশ', 'sm-07', 'erp-07'],
    standardUsed: 'Standard Imprest Accounting System',
    description: 'Site engineer imprest fund management with debit/credit logging, low-balance warnings, voucher slips, and financial rollup.',
  },
  {
    id: 'cube-tests',
    moduleId: 'cube-tests',
    title: 'Concrete Pour & Cube/Cylinder Compressive Strength Log (কিউব টেস্ট)',
    shortLabel: 'Cube Crushing Register',
    shortCode: 'SM-08',
    category: 'Site Management & ERP',
    subCategory: 'QA/QC Materials',
    keywords: ['cube test', 'cylinder test', 'compressive strength', '7-day', '28-day', 'slump test', 'crushing', 'dcr', 'কিউব টেস্ট', 'সিলিন্ডার', 'sm-08', 'erp-08'],
    standardUsed: 'ASTM C39 / BS 1881 / BNBC 2020 Chapter 5',
    description: 'Pour logging with auto-calculated 7-day and 28-day crushing schedules, DCR strength compliance, and test certificate generation.',
  },
  {
    id: 'daily-progress-report',
    moduleId: 'daily-progress-report',
    title: 'Master 1-Click Daily Progress Report (DPR) Aggregator (ডেইলি প্রগ্রেস রিপোর্ট)',
    shortLabel: 'Daily Progress Report',
    shortCode: 'SM-09',
    category: 'Site Management & ERP',
    subCategory: 'Field Reporting',
    keywords: ['dpr', 'daily progress report', 'site report', 'weather', 'manpower', 'materials log', 'progress', 'site diary', 'রিপোর্ট', 'ডিপিআর', 'sm-09', 'erp-09'],
    standardUsed: 'Standard Construction Project DPR Protocol',
    description: '1-Click automated synthesis of attendance headcount, store inward/outward transactions, active milestones, and petty cash into an official A4 DPR.',
  },
];

/**
 * Fast lookup map by Tool ID
 */
export const TOOL_REGISTRY_MAP: Record<string, ToolRegistryEntry> = TOOL_REGISTRY.reduce(
  (acc, tool) => {
    acc[tool.id] = tool;
    if (tool.moduleId) {
      acc[tool.moduleId] = tool;
    }
    return acc;
  },
  {} as Record<string, ToolRegistryEntry>
);

/**
 * Unique list of tool disciplines
 */
export const TOOL_DISCIPLINES: ToolDiscipline[] = [
  'Structural',
  'Geotechnical',
  'BOQ & Takeoff',
  'Materials & Mix',
  'Hydraulics & Drainage',
  'Earthwork & Surveying',
  'Architecture & By-Laws',
  'CAD & Utilities',
  'Site QC & Field',
  'Site Management & ERP',
];
