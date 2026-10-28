import { TakeoffCategory, TakeoffUnit, WBSSection, BidTabulationData } from '../types/civil';

export interface RateLibraryItem {
  code: string;
  wbsSectionId: string;
  category: TakeoffCategory;
  description: string;
  unit: TakeoffUnit;
  baseRateBdt: number;
  laborRateBdt: number;
  materialRateBdt: number;
  specNotes: string;
}

export interface RateLibrary {
  id: 'pwd-2024' | 'pwd-2025' | 'lged-2024' | 'commercial';
  name: string;
  version: string;
  effectiveDate: string;
  authority: string;
  description: string;
  items: RateLibraryItem[];
}

export interface RegionalDistrictAdjustment {
  id: string;
  name: string;
  division: string;
  multiplier: number; // e.g. 1.05 (+5% logistics & cartage)
  transportAllowanceBdtPerTon: number;
  notes: string;
}

/**
 * Standard Work Breakdown Structure (WBS) Chapters
 */
export const STANDARD_WBS_SECTIONS: WBSSection[] = [
  {
    id: 'sec-100',
    code: '100',
    title: 'Section 100: General & Site Preliminaries',
    category: 'misc',
    description: 'Mobilization, engineering field office, health & safety, lab testing, signboards.',
  },
  {
    id: 'sec-200',
    code: '200',
    title: 'Section 200: Earthwork & Site Excavation',
    category: 'earthwork',
    description: 'Site clearance, foundation trench excavation in all soils, backfilling, and sand compaction.',
  },
  {
    id: 'sec-300',
    code: '300',
    title: 'Section 300: Substructure & Mass Concrete',
    category: 'substructure',
    description: 'Lean concrete (1:3:6), single brick flat soling, RCC isolated footings, grade beams, and plinth.',
  },
  {
    id: 'sec-400',
    code: '400',
    title: 'Section 400: Superstructure & RCC Frame',
    category: 'superstructure',
    description: 'Reinforced cement concrete (1:1.5:3 / 1:2:4) in columns, shear walls, beams, and suspended slabs.',
  },
  {
    id: 'sec-500',
    code: '500',
    title: 'Section 500: Reinforcement Steel (500W TMT)',
    category: 'rebar',
    description: 'Deformed 500W Grade 75/60 high-strength reinforcement cutting, bending, binding, and placement.',
  },
  {
    id: 'sec-600',
    code: '600',
    title: 'Section 600: Masonry & Damp-Proof Course',
    category: 'masonry',
    description: '1st class brickwork (1:6 / 1:4 mortar), 125mm and 250mm perimeter walls, and DPC.',
  },
  {
    id: 'sec-700',
    code: '700',
    title: 'Section 700: Surface Finishes, Plaster & Tiles',
    category: 'finishing',
    description: '12mm cement plaster (1:4), neat cement finishing, homogeneous floor tiles, and weather coat paint.',
  },
  {
    id: 'sec-800',
    code: '800',
    title: 'Section 800: Plumbing, Sanitary & Site Drainage',
    category: 'plumbing',
    description: 'uPVC soil and waste pipes, stormwater surface drainage, inspection chambers, and soak pit.',
  },
  {
    id: 'sec-900',
    code: '900',
    title: 'Section 900: Electrical & Auxiliary Works',
    category: 'electrical',
    description: 'Conduit laying, main distribution board, earthing pits, and lighting rough-ins.',
  },
];

/**
 * Regional Price Adjustment Indices across Bangladesh
 */
export const REGIONAL_DISTRICT_ADJUSTMENTS: RegionalDistrictAdjustment[] = [
  {
    id: 'dhaka',
    name: 'Dhaka Metropolitan & Core',
    division: 'Dhaka',
    multiplier: 1.00,
    transportAllowanceBdtPerTon: 0,
    notes: 'National base index. High supplier density and minimal freight surcharge.',
  },
  {
    id: 'gazipur',
    name: 'Gazipur Industrial Belt',
    division: 'Dhaka',
    multiplier: 1.01,
    transportAllowanceBdtPerTon: 450,
    notes: 'Short-haul highway cartage from Narayanganj cement/steel river ghats.',
  },
  {
    id: 'narayanganj',
    name: 'Narayanganj River Port Hub',
    division: 'Dhaka',
    multiplier: 0.99,
    transportAllowanceBdtPerTon: -250,
    notes: 'Primary river barge terminal for bulk clinker, scrap steel, and Sylhet sand.',
  },
  {
    id: 'chattogram',
    name: 'Chattogram Port & Industrial Zone',
    division: 'Chattogram',
    multiplier: 1.03,
    transportAllowanceBdtPerTon: 850,
    notes: 'Major sea import hub; hilly terrain and coastal microclimate allowances.',
  },
  {
    id: 'coxsbazar',
    name: 'Cox’s Bazar & Marine Corridor',
    division: 'Chattogram',
    multiplier: 1.10,
    transportAllowanceBdtPerTon: 2400,
    notes: 'Southern coastal freight surcharge, marine salinity protection, fine sand hauling.',
  },
  {
    id: 'sylhet',
    name: 'Sylhet & Bholaganj Quarry Belt',
    division: 'Sylhet',
    multiplier: 1.05,
    transportAllowanceBdtPerTon: 1200,
    notes: 'Abundant coarse sand & stone shingles; higher cement & rebar road freight from Dhaka.',
  },
  {
    id: 'khulna',
    name: 'Khulna & Mongla Coastal Industrial',
    division: 'Khulna',
    multiplier: 1.06,
    transportAllowanceBdtPerTon: 1600,
    notes: 'Salinity-resistant sulphate resistant cement (SRC) requirements and river crossings.',
  },
  {
    id: 'barishal',
    name: 'Barishal & Southern Riverine Belt',
    division: 'Barishal',
    multiplier: 1.08,
    transportAllowanceBdtPerTon: 2100,
    notes: 'Multiple river ferry transitions and soft deltaic subsoil shoring allowances.',
  },
  {
    id: 'rajshahi',
    name: 'Rajshahi & Western Plain',
    division: 'Rajshahi',
    multiplier: 1.04,
    transportAllowanceBdtPerTon: 1100,
    notes: 'Padma sand availability; road haulage for imported deformed steel bars.',
  },
  {
    id: 'rangpur',
    name: 'Rangpur & Northern Gateway',
    division: 'Rangpur',
    multiplier: 1.07,
    transportAllowanceBdtPerTon: 1950,
    notes: 'Long transport haul from Meghna/Dhaka production mills.',
  },
  {
    id: 'mymensingh',
    name: 'Mymensingh & Haor Outskirts',
    division: 'Mymensingh',
    multiplier: 1.03,
    transportAllowanceBdtPerTon: 750,
    notes: 'Direct connectivity with Netrokona/Garo sand sources.',
  },
  {
    id: 'bandarban',
    name: 'Bandarban & CHT Hill Tracts',
    division: 'Chattogram',
    multiplier: 1.14,
    transportAllowanceBdtPerTon: 3400,
    notes: 'Mountainous steep haulage, manual head-load carrying, and remote staging.',
  },
];

/**
 * Standard PWD Schedule of Rates 2024 (Official Public Works Department)
 */
export const PWD_RATES_2024: RateLibrary = {
  id: 'pwd-2024',
  name: 'PWD Schedule of Rates 2024',
  version: '2024.1',
  effectiveDate: 'Jan 2024',
  authority: 'Public Works Department (PWD), Government of Bangladesh',
  description: 'Official schedule for government civil, building, and institutional infrastructure projects.',
  items: [
    {
      code: 'PWD-101',
      wbsSectionId: 'sec-100',
      category: 'misc',
      description: 'Site mobilization, boundary fencing, quality testing setup and HSE equipment',
      unit: 'lump-sum',
      baseRateBdt: 150000,
      laborRateBdt: 60000,
      materialRateBdt: 90000,
      specNotes: 'PWD General Specifications Clause 1.4',
    },
    {
      code: 'PWD-201',
      wbsSectionId: 'sec-200',
      category: 'earthwork',
      description: 'Earth excavation in foundation trenches (depth up to 1.5m) including stacking/disposal up to 50m',
      unit: 'm3',
      baseRateBdt: 245,
      laborRateBdt: 220,
      materialRateBdt: 25,
      specNotes: 'PWD Item 2.1.1 (Ordinary soil)',
    },
    {
      code: 'PWD-202',
      wbsSectionId: 'sec-200',
      category: 'earthwork',
      description: 'Local sand filling in foundation trenches and plinth compacted in layers with watering (FM 0.8-1.0)',
      unit: 'm3',
      baseRateBdt: 980,
      laborRateBdt: 260,
      materialRateBdt: 720,
      specNotes: 'PWD Item 2.3.2 (Compacted dry density ≥ 95%)',
    },
    {
      code: 'PWD-301',
      wbsSectionId: 'sec-300',
      category: 'substructure',
      description: 'Single brick flat soling (BFS) with 1st class bricks including sand packing',
      unit: 'm2',
      baseRateBdt: 420,
      laborRateBdt: 110,
      materialRateBdt: 310,
      specNotes: 'PWD Item 3.1.2 (Uniform bed, joints filled with dry sand)',
    },
    {
      code: 'PWD-302',
      wbsSectionId: 'sec-300',
      category: 'substructure',
      description: 'Plain Cement Concrete (PCC 1:3:6) in foundation base with brick chips and local sand',
      unit: 'm3',
      baseRateBdt: 8250,
      laborRateBdt: 1450,
      materialRateBdt: 6800,
      specNotes: 'PWD Item 3.2.1 (Minimum 28-day strength fc = 15 MPa)',
    },
    {
      code: 'PWD-401',
      wbsSectionId: 'sec-400',
      category: 'superstructure',
      description: 'Reinforced Cement Concrete (RCC 1:1.5:3) in columns, beams & slabs using stone chips and coarse sand (FM 2.5)',
      unit: 'm3',
      baseRateBdt: 14200,
      laborRateBdt: 2200,
      materialRateBdt: 12000,
      specNotes: 'PWD Item 4.2.3 (Target cylinder strength fc = 25 MPa, slump 75-100mm)',
    },
    {
      code: 'PWD-402',
      wbsSectionId: 'sec-400',
      category: 'superstructure',
      description: 'Steel shuttering & scaffolding for suspended RCC beams, columns and slabs including release oil',
      unit: 'm2',
      baseRateBdt: 580,
      laborRateBdt: 320,
      materialRateBdt: 260,
      specNotes: 'PWD Item 4.5.1 (Leak-proof steel ply panels with adjustable steel props)',
    },
    {
      code: 'PWD-501',
      wbsSectionId: 'sec-500',
      category: 'rebar',
      description: 'Supplying, cutting, bending, fabricating and placing 500W Grade 75/60 deformed rebar including 20G binding wire',
      unit: 'kg',
      baseRateBdt: 118,
      laborRateBdt: 14,
      materialRateBdt: 104,
      specNotes: 'PWD Item 5.1.1 (BDS ISO 6935-2 / ASTM A615 Grade 75)',
    },
    {
      code: 'PWD-601',
      wbsSectionId: 'sec-600',
      category: 'masonry',
      description: '1st class brickwork in foundation and plinth in cement-sand mortar (1:6) with minimum 10.5 MPa brick strength',
      unit: 'm3',
      baseRateBdt: 8650,
      laborRateBdt: 1850,
      materialRateBdt: 6800,
      specNotes: 'PWD Item 6.1.2 (Cured continuously for 7 days)',
    },
    {
      code: 'PWD-602',
      wbsSectionId: 'sec-600',
      category: 'masonry',
      description: '125mm thick 1st class brick partition wall in cement-sand mortar (1:4) including reinforcement ties',
      unit: 'm2',
      baseRateBdt: 1120,
      laborRateBdt: 310,
      materialRateBdt: 810,
      specNotes: 'PWD Item 6.2.1 (Horizontal wire mesh every 4 courses)',
    },
    {
      code: 'PWD-701',
      wbsSectionId: 'sec-700',
      category: 'finishing',
      description: '12mm thick cement-sand plaster (1:4) to interior masonry walls with neat smooth float finish',
      unit: 'm2',
      baseRateBdt: 240,
      laborRateBdt: 120,
      materialRateBdt: 120,
      specNotes: 'PWD Item 7.1.1 (Clean plaster surface free from cracks)',
    },
    {
      code: 'PWD-702',
      wbsSectionId: 'sec-700',
      category: 'finishing',
      description: '600mm x 600mm homogeneous floor tiles set on 25mm cement mortar (1:3) bed with neat epoxy grouting',
      unit: 'm2',
      baseRateBdt: 1850,
      laborRateBdt: 350,
      materialRateBdt: 1500,
      specNotes: 'PWD Item 7.4.2 (First class non-slip vitrified porcelain)',
    },
    {
      code: 'PWD-801',
      wbsSectionId: 'sec-800',
      category: 'plumbing',
      description: '110mm dia uPVC Class-D soil & rainwater downpipe including brackets, solvent cement and fittings',
      unit: 'm',
      baseRateBdt: 820,
      laborRateBdt: 210,
      materialRateBdt: 610,
      specNotes: 'PWD Sanitary Item 8.2.1',
    },
  ],
};

/**
 * PWD Schedule of Rates 2025 (Escalated 2025 Index)
 */
export const PWD_RATES_2025: RateLibrary = {
  ...PWD_RATES_2024,
  id: 'pwd-2025',
  name: 'PWD Schedule of Rates 2025 (Projected)',
  version: '2025.1',
  effectiveDate: 'Jan 2025',
  description: 'Updated rate schedule factoring fuel inflation, electricity tariffs, and transport adjustments.',
  items: PWD_RATES_2024.items.map((item) => ({
    ...item,
    baseRateBdt: Math.round(item.baseRateBdt * 1.08 * 10) / 10,
    laborRateBdt: Math.round(item.laborRateBdt * 1.10 * 10) / 10,
    materialRateBdt: Math.round(item.materialRateBdt * 1.075 * 10) / 10,
  })),
};

/**
 * LGED Rural Infrastructure Rates (Local Government Engineering Dept)
 */
export const LGED_RATES_2024: RateLibrary = {
  id: 'lged-2024',
  name: 'LGED Rural Infrastructure Schedule 2024',
  version: '2024.2',
  effectiveDate: 'Mar 2024',
  authority: 'Local Government Engineering Department (LGED)',
  description: 'Optimized rates for upazila roads, box culverts, union parishad complexes, and rural growth centres.',
  items: [
    {
      code: 'LGED-101',
      wbsSectionId: 'sec-100',
      category: 'misc',
      description: 'Site clearance, setting out alignments, bench marks and traffic diversion signals',
      unit: 'lump-sum',
      baseRateBdt: 85000,
      laborRateBdt: 45000,
      materialRateBdt: 40000,
      specNotes: 'LGED General Technical Specification Sec 1',
    },
    {
      code: 'LGED-201',
      wbsSectionId: 'sec-200',
      category: 'earthwork',
      description: 'Earthwork in road embankment cutting & filling with lead up to 100m using mechanical excavator',
      unit: 'm3',
      baseRateBdt: 215,
      laborRateBdt: 180,
      materialRateBdt: 35,
      specNotes: 'LGED Item 2.1 (Compacted dry density ≥ 98% Proctor)',
    },
    {
      code: 'LGED-301',
      wbsSectionId: 'sec-300',
      category: 'substructure',
      description: 'Single Brick Flat Soling (BFS) with selected overburnt picked jhama / 1st class bricks',
      unit: 'm2',
      baseRateBdt: 385,
      laborRateBdt: 95,
      materialRateBdt: 290,
      specNotes: 'LGED Subgrade Specification',
    },
    {
      code: 'LGED-401',
      wbsSectionId: 'sec-400',
      category: 'superstructure',
      description: 'Reinforced Cement Concrete (RCC 1:2:4) in culvert deck slab, wing walls, and parapet using stone chips',
      unit: 'm3',
      baseRateBdt: 12800,
      laborRateBdt: 1950,
      materialRateBdt: 10850,
      specNotes: 'LGED Culvert Deck (fc = 21 MPa)',
    },
    {
      code: 'LGED-501',
      wbsSectionId: 'sec-500',
      category: 'rebar',
      description: '500W TMT ribbed rebar fabrication & placing in rural culverts and retaining structures',
      unit: 'kg',
      baseRateBdt: 114,
      laborRateBdt: 12,
      materialRateBdt: 102,
      specNotes: 'LGED Grade 75 Specification',
    },
    {
      code: 'LGED-601',
      wbsSectionId: 'sec-600',
      category: 'masonry',
      description: 'Brick masonry in retaining walls and culvert wingwalls using cement mortar (1:4)',
      unit: 'm3',
      baseRateBdt: 8100,
      laborRateBdt: 1650,
      materialRateBdt: 6450,
      specNotes: 'LGED Heavy duty picked brick masonry',
    },
  ],
};

/**
 * Commercial Private Developer Market Rates
 */
export const COMMERCIAL_RATES: RateLibrary = {
  id: 'commercial',
  name: 'Private Commercial & High-Rise Market Rates',
  version: '2024.4',
  effectiveDate: 'Latest 2024/2026',
  authority: 'Leading Commercial EPC Developers / Real Estate Association',
  description: 'Premium specifications utilizing batching plant ready-mix concrete, CNC cut-and-bend rebar, and imported finishes.',
  items: [
    {
      code: 'COM-101',
      wbsSectionId: 'sec-100',
      category: 'misc',
      description: 'Full site setup with digital CCTV surveillance, tower crane foundation, and QA/QC laboratory',
      unit: 'lump-sum',
      baseRateBdt: 350000,
      laborRateBdt: 120000,
      materialRateBdt: 230000,
      specNotes: 'Tier-1 High-Rise Developer Specification',
    },
    {
      code: 'COM-201',
      wbsSectionId: 'sec-200',
      category: 'earthwork',
      description: 'Deep basement excavation with hydraulic excavator, temporary sheet piling shoring and automated dewatering',
      unit: 'm3',
      baseRateBdt: 340,
      laborRateBdt: 180,
      materialRateBdt: 160,
      specNotes: 'Two-tier basement excavation',
    },
    {
      code: 'COM-401',
      wbsSectionId: 'sec-400',
      category: 'superstructure',
      description: 'Ready-Mix Concrete (30 MPa / 4350 psi) with polycarboxylate ether superplasticizer, pumped to high-rise levels',
      unit: 'm3',
      baseRateBdt: 16800,
      laborRateBdt: 2100,
      materialRateBdt: 14700,
      specNotes: 'Slump 150-180mm, automated transit mixer delivery',
    },
    {
      code: 'COM-501',
      wbsSectionId: 'sec-500',
      category: 'rebar',
      description: 'High-strength 500W Grade 75/80 Thermo-Mechanically Treated (TMT) rebars with mechanical coupler splices',
      unit: 'kg',
      baseRateBdt: 124,
      laborRateBdt: 16,
      materialRateBdt: 108,
      specNotes: 'BSRM Ultima / AKS Extreme Grade 500W',
    },
    {
      code: 'COM-601',
      wbsSectionId: 'sec-600',
      category: 'masonry',
      description: 'Autoclaved Aerated Concrete (AAC) blocks laid with thin-bed polymer adhesive mortar',
      unit: 'm3',
      baseRateBdt: 9800,
      laborRateBdt: 1900,
      materialRateBdt: 7900,
      specNotes: 'Thermal & sound insulated lightweight blocks',
    },
    {
      code: 'COM-702',
      wbsSectionId: 'sec-700',
      category: 'finishing',
      description: '800mm x 800mm mirror-polished glazed vitrified porcelain tiles on latex-modified adhesive bed',
      unit: 'm2',
      baseRateBdt: 2450,
      laborRateBdt: 450,
      materialRateBdt: 2000,
      specNotes: 'Grade AAA rectified porcelain',
    },
  ],
};

export const ALL_RATE_LIBRARIES: Record<string, RateLibrary> = {
  'pwd-2024': PWD_RATES_2024,
  'pwd-2025': PWD_RATES_2025,
  'lged-2024': LGED_RATES_2024,
  'commercial': COMMERCIAL_RATES,
};

/**
 * Default sample bid tabulation dataset (competing quotes from 3 vendors)
 */
export function createDefaultBidTabulation(): BidTabulationData {
  return {
    vendor1Name: 'Seven Rings & BSRM Synergy',
    vendor2Name: 'Bashundhara & AKS Heavy Industries',
    vendor3Name: 'Shah Cement & KSRM Steels',
    items: [
      {
        id: 'bid-1',
        itemDescription: 'Portland Composite Cement (PCC 50kg bag) - CEM II/B-M',
        category: 'substructure',
        unit: 'bags',
        quantity: 1200,
        engineersEstimateRate: 540,
        vendor1: { vendorName: 'Seven Rings & BSRM Synergy', unitRate: 525, notes: 'Direct factory delivery, 30 days credit' },
        vendor2: { vendorName: 'Bashundhara & AKS Heavy Industries', unitRate: 535, notes: 'Includes river barge delivery to site' },
        vendor3: { vendorName: 'Shah Cement & KSRM Steels', unitRate: 520, notes: 'Advance payment discount, rapid dispatch' },
      },
      {
        id: 'bid-2',
        itemDescription: '500W Grade 75 Deformed Steel Rebars (8mm - 25mm bundle)',
        category: 'rebar',
        unit: 'ton',
        quantity: 35,
        engineersEstimateRate: 104000,
        vendor1: { vendorName: 'Seven Rings & BSRM Synergy', unitRate: 101500, notes: 'BSRM Xtreme 500W with mill test certificate' },
        vendor2: { vendorName: 'Bashundhara & AKS Heavy Industries', unitRate: 99800, notes: 'AKS 500W, lowest price point' },
        vendor3: { vendorName: 'Shah Cement & KSRM Steels', unitRate: 102200, notes: 'KSRM 500W, bundled with 20G binding wire' },
      },
      {
        id: 'bid-3',
        itemDescription: '1st Class Picked Bricks (10.5 MPa crushing strength)',
        category: 'masonry',
        unit: 'nos',
        quantity: 45000,
        engineersEstimateRate: 13.5,
        vendor1: { vendorName: 'Seven Rings & BSRM Synergy', unitRate: 13.2, notes: 'Auto-kiln gas fired, uniform size' },
        vendor2: { vendorName: 'Bashundhara & AKS Heavy Industries', unitRate: 13.0, notes: 'Hybrid Hoffman kiln, zero breakage allowance' },
        vendor3: { vendorName: 'Shah Cement & KSRM Steels', unitRate: 13.8, notes: 'Premium selected red bricks' },
      },
      {
        id: 'bid-4',
        itemDescription: 'Sylhet Coarse Sand (Fineness Modulus FM 2.50)',
        category: 'substructure',
        unit: 'cft',
        quantity: 6500,
        engineersEstimateRate: 55,
        vendor1: { vendorName: 'Seven Rings & BSRM Synergy', unitRate: 52, notes: 'Washed river sand, silt content < 3%' },
        vendor2: { vendorName: 'Bashundhara & AKS Heavy Industries', unitRate: 54, notes: 'Bholaganj coarse screening' },
        vendor3: { vendorName: 'Shah Cement & KSRM Steels', unitRate: 50, notes: 'Bulk barge discount at ghat' },
      },
      {
        id: 'bid-5',
        itemDescription: 'RCC Shuttering, Scaffolding & Formwork Subcontract',
        category: 'superstructure',
        unit: 'm2',
        quantity: 1400,
        engineersEstimateRate: 350,
        vendor1: { vendorName: 'Seven Rings & BSRM Synergy', unitRate: 330, notes: 'Steel plates + trained carpenters' },
        vendor2: { vendorName: 'Bashundhara & AKS Heavy Industries', unitRate: 360, notes: 'Includes safety harness and netting' },
        vendor3: { vendorName: 'Shah Cement & KSRM Steels', unitRate: 325, notes: 'Lowest labor rate, established team' },
      },
    ],
  };
}
