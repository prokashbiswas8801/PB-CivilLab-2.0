import {
  BeamParameters,
  ContinuousBeamParameters,
  RateAnalysisParameters,
  BOQParameters,
  MasterMarketRates,
  ConcreteMaterialParameters,
  RebarBBSParameters,
  MasonryParameters,
  EarthworkParameters,
} from '../types/civil';

export interface BeamWorkedExample {
  id: string;
  module: 'beam-analysis';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<BeamParameters>;
}

export interface ContinuousBeamWorkedExample {
  id: string;
  module: 'continuous-beam';
  title: string;
  subtitle: string;
  category: string;
  params: ContinuousBeamParameters;
}

export interface RateAnalysisWorkedExample {
  id: string;
  module: 'rate-analysis';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<RateAnalysisParameters>;
  marketRates?: Partial<MasterMarketRates>;
}

export interface BoqWorkedExample {
  id: string;
  module: 'boq-estimator';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<BOQParameters>;
}

export interface ConcreteMaterialsWorkedExample {
  id: string;
  module: 'concrete-materials';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<ConcreteMaterialParameters>;
}

export interface RebarBbsWorkedExample {
  id: string;
  module: 'rebar-bbs';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<RebarBBSParameters>;
}

export interface MasonryWorkedExample {
  id: string;
  module: 'masonry-finishes';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<MasonryParameters>;
}

export interface EarthworkWorkedExample {
  id: string;
  module: 'earthwork-alignment';
  title: string;
  subtitle: string;
  category: string;
  params: Partial<EarthworkParameters>;
}

export type WorkedExampleEntry =
  | BeamWorkedExample
  | ContinuousBeamWorkedExample
  | RateAnalysisWorkedExample
  | BoqWorkedExample
  | ConcreteMaterialsWorkedExample
  | RebarBbsWorkedExample
  | MasonryWorkedExample
  | EarthworkWorkedExample;

export const BEAM_WORKED_EXAMPLES: BeamWorkedExample[] = [
  {
    id: 'ss-udl-6m',
    module: 'beam-analysis',
    title: 'Simply Supported Girder (L = 6m, w = 15 kN/m)',
    subtitle: 'Classic wL²/8 = 67.5 kN·m flexure + 5wL⁴/384EI deflection benchmark',
    category: 'Textbook Benchmark',
    params: {
      spanLengthM: 6.0,
      uniformLoadKnPerM: 15,
      pointLoadKn: 0,
      pointLoadPositionM: 3.0,
      elasticModulusGpa: 200,
      momentOfInertiaCm4: 28000,
      supportCondition: 'simply-supported',
      overhangLeftM: 0,
      overhangRightM: 0,
      distributedLoadType: 'uniform',
      endLoadKnPerM: 15,
      allowableStressMpa: 250,
      sectionDepthMm: 450,
      codeStandard: 'BNBC-2020',
    },
  },
  {
    id: 'cantilever-balcony',
    module: 'beam-analysis',
    title: 'Cantilever Balcony + Parapet Point Load',
    subtitle: 'L = 2.8m overhang with 12 kN/m slab UDL + 18 kN tip parapet',
    category: 'Residential RC',
    params: {
      spanLengthM: 2.8,
      uniformLoadKnPerM: 12,
      pointLoadKn: 18,
      pointLoadPositionM: 2.8,
      elasticModulusGpa: 25,
      momentOfInertiaCm4: 185000,
      supportCondition: 'cantilever',
      overhangLeftM: 0,
      overhangRightM: 0,
      distributedLoadType: 'uniform',
      endLoadKnPerM: 12,
      allowableStressMpa: 220,
      sectionDepthMm: 500,
      codeStandard: 'BNBC-2020',
    },
  },
  {
    id: 'overhanging-trapezoidal',
    module: 'beam-analysis',
    title: 'Double-Overhanging Transfer Girder (Trapezoidal)',
    subtitle: '6.5m main span + 1.5m/2.0m cantilevers with hogging contraflexure',
    category: 'Commercial Frame',
    params: {
      spanLengthM: 6.5,
      uniformLoadKnPerM: 14,
      pointLoadKn: 35,
      pointLoadPositionM: 8.5,
      elasticModulusGpa: 200,
      momentOfInertiaCm4: 65000,
      supportCondition: 'overhanging',
      overhangLeftM: 1.5,
      overhangRightM: 2.0,
      distributedLoadType: 'trapezoidal',
      endLoadKnPerM: 26,
      allowableStressMpa: 250,
      sectionDepthMm: 550,
      codeStandard: 'BNBC-2020',
    },
  },
  {
    id: 'fixed-hydrostatic',
    module: 'beam-analysis',
    title: 'Fixed-End Retaining Wall / Hydrostatic Beam',
    subtitle: '5.5m fixed girder under increasing triangular fluid pressure (0 → 30 kN/m)',
    category: 'Water / Retaining',
    params: {
      spanLengthM: 5.5,
      uniformLoadKnPerM: 30,
      pointLoadKn: 0,
      pointLoadPositionM: 2.75,
      elasticModulusGpa: 27,
      momentOfInertiaCm4: 240000,
      supportCondition: 'fixed-ends',
      overhangLeftM: 0,
      overhangRightM: 0,
      distributedLoadType: 'triangular-increasing',
      endLoadKnPerM: 30,
      allowableStressMpa: 240,
      sectionDepthMm: 550,
      codeStandard: 'ACI-318',
    },
  },
];

export const CONTINUOUS_BEAM_WORKED_EXAMPLES: ContinuousBeamWorkedExample[] = [
  {
    id: '3-span-asymmetric',
    module: 'continuous-beam',
    title: '3-Span Asymmetric Floor Beam (Dhaka RC Frame)',
    subtitle: '5.5m + 7.2m + 4.8m unequal spans with point girder reaction on middle bay',
    category: 'BNBC-2020 Frame',
    params: {
      spanCount: 3,
      leftSupport: 'pin',
      rightSupport: 'pin',
      sectionDepthMm: 600,
      sectionWidthMm: 300,
      allowableStressMpa: 250,
      concreteGradeFckMpa: 25,
      codeStandard: 'BNBC-2020',
      spans: [
        {
          id: 'ex3-s1',
          spanIndex: 0,
          lengthM: 5.5,
          udlKnPerM: 28,
          pointLoadKn: 0,
          pointLoadPositionM: 2.75,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 540000,
          elasticModulusGpa: 24,
        },
        {
          id: 'ex3-s2',
          spanIndex: 1,
          lengthM: 7.2,
          udlKnPerM: 34,
          pointLoadKn: 65,
          pointLoadPositionM: 3.6,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 540000,
          elasticModulusGpa: 24,
        },
        {
          id: 'ex3-s3',
          spanIndex: 2,
          lengthM: 4.8,
          udlKnPerM: 24,
          pointLoadKn: 0,
          pointLoadPositionM: 2.4,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 540000,
          elasticModulusGpa: 24,
        },
      ],
    },
  },
  {
    id: '2-span-fixed-bridge',
    module: 'continuous-beam',
    title: '2-Span Continuous Bridge Deck Girder',
    subtitle: 'Fixed abutments · Equal 10m spans under 45 kN/m + 120 kN axle point load',
    category: 'Bridge / AASHTO',
    params: {
      spanCount: 2,
      leftSupport: 'fixed',
      rightSupport: 'fixed',
      sectionDepthMm: 850,
      sectionWidthMm: 400,
      allowableStressMpa: 250,
      concreteGradeFckMpa: 35,
      codeStandard: 'ACI-318',
      spans: [
        {
          id: 'ex2-s1',
          spanIndex: 0,
          lengthM: 10.0,
          udlKnPerM: 45,
          pointLoadKn: 120,
          pointLoadPositionM: 4.0,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 2040000,
          elasticModulusGpa: 28,
        },
        {
          id: 'ex2-s2',
          spanIndex: 1,
          lengthM: 10.0,
          udlKnPerM: 45,
          pointLoadKn: 0,
          pointLoadPositionM: 5.0,
          triangularLoadKnPerM: 0,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 2040000,
          elasticModulusGpa: 28,
        },
      ],
    },
  },
  {
    id: '4-span-hydrostatic-tank',
    module: 'continuous-beam',
    title: '4-Span Underground Tank Wall Strip',
    subtitle: 'Multi-bay symmetric & triangular earth/water pressure distribution',
    category: 'Hydraulic Structure',
    params: {
      spanCount: 4,
      leftSupport: 'fixed',
      rightSupport: 'pin',
      sectionDepthMm: 500,
      sectionWidthMm: 350,
      allowableStressMpa: 230,
      concreteGradeFckMpa: 30,
      codeStandard: 'BNBC-2020',
      spans: [
        {
          id: 'ex4-s1',
          spanIndex: 0,
          lengthM: 4.5,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.25,
          triangularLoadKnPerM: 22,
          triangularLoadPattern: 'increasing',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
        {
          id: 'ex4-s2',
          spanIndex: 1,
          lengthM: 5.0,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.5,
          triangularLoadKnPerM: 25,
          triangularLoadPattern: 'symmetric',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
        {
          id: 'ex4-s3',
          spanIndex: 2,
          lengthM: 5.0,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.5,
          triangularLoadKnPerM: 25,
          triangularLoadPattern: 'symmetric',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
        {
          id: 'ex4-s4',
          spanIndex: 3,
          lengthM: 4.5,
          udlKnPerM: 18,
          pointLoadKn: 0,
          pointLoadPositionM: 2.25,
          triangularLoadKnPerM: 22,
          triangularLoadPattern: 'decreasing',
          momentOfInertiaCm4: 364000,
          elasticModulusGpa: 26,
        },
      ],
    },
  },
];

export const RATE_ANALYSIS_WORKED_EXAMPLES: RateAnalysisWorkedExample[] = [
  {
    id: 'pwd-rcc-column-dhaka',
    module: 'rate-analysis',
    title: 'PWD RCC 1:1.5:3 Column & Beam Rate (Dhaka)',
    subtitle: '20mm stone chips, Sylhet sand (FM 2.5), 115 kg/m³ 500W rebar, 10% CP&OH + 7.5% VAT/AIT',
    category: 'PWD Schedule 2025',
    params: {
      workType: 'rcc-1-1.5-3',
      basisVolumeM3: 1.0,
      currency: 'BDT',
      cementPricePerBag: 545,
      sandPricePerM3: 2401,
      stoneChipsPricePerM3: 6886,
      rebarPricePerKg: 102,
      rebarAllowanceKgPerM3: 115,
      admixturePricePerKg: 185,
      admixtureDoseKgPerM3: 1.5,
      wastagePercent: 2.5,
      masonDailyWage: 950,
      masonDaysRequired: 0.45,
      laborerDailyWage: 650,
      laborerDaysRequired: 2.8,
      barBenderDailyWage: 900,
      barBenderDaysRequired: 1.2,
      mixerHirePerM3: 320,
      vibratorHirePerM3: 95,
      shutteringScaffoldingPerM3: 1250,
      waterElectricityPercent: 1.5,
      contractorProfitPercent: 10.0,
      vatAitPercent: 7.5,
      localCostIndex: 1.0,
      materialCostIndex: 1.0,
      laborCostIndex: 1.0,
      equipmentCostIndex: 1.0,
    },
    marketRates: {
      cementBag50Kg: 545,
      sylhetSandPerCft: 68,
      stoneChips20mmPerCft: 195,
      rebar500WPerTon: 102000,
      headMasonDailyWage: 950,
      helperDailyWage: 650,
      barBenderDailyWage: 900,
    },
  },
  {
    id: 'pwd-125mm-partition',
    module: 'rate-analysis',
    title: '125mm (5") Brick Partition Wall (1:4 Mortar / m²)',
    subtitle: '52 first-class bricks/m² + 0.028 m³ dry 1:4 local sand mortar + 3% breakage wastage',
    category: 'Masonry Trade',
    params: {
      workType: 'brickwork-125mm-1-4',
      basisVolumeM3: 1.0,
      currency: 'BDT',
      cementPricePerBag: 545,
      localSandPricePerM3: 1201,
      brickPricePer1000: 12500,
      wastagePercent: 3.0,
      masonDailyWage: 950,
      masonDaysRequired: 0.16,
      laborerDailyWage: 650,
      laborerDaysRequired: 0.28,
      barBenderDaysRequired: 0,
      mixerHirePerM3: 0,
      vibratorHirePerM3: 0,
      shutteringScaffoldingPerM3: 38,
      waterElectricityPercent: 1.5,
      contractorProfitPercent: 10.0,
      vatAitPercent: 7.5,
      localCostIndex: 1.0,
    },
  },
  {
    id: 'lged-pcc-subbase',
    module: 'rate-analysis',
    title: 'LGED PCC 1:3:6 Footing Sub-base (Brick Khoa)',
    subtitle: '40mm picked jhama brick khoa + local FM 1.5 sand, 1.08x rural transport index',
    category: 'LGED Rural',
    params: {
      workType: 'pcc-1-3-6',
      basisVolumeM3: 1.0,
      currency: 'BDT',
      cementPricePerBag: 560,
      localSandPricePerM3: 1201,
      brickKhoaPricePerM3: 4414,
      wastagePercent: 2.0,
      masonDailyWage: 900,
      masonDaysRequired: 0.25,
      laborerDailyWage: 620,
      laborerDaysRequired: 1.85,
      barBenderDaysRequired: 0,
      mixerHirePerM3: 180,
      vibratorHirePerM3: 45,
      shutteringScaffoldingPerM3: 120,
      waterElectricityPercent: 1.5,
      contractorProfitPercent: 10.0,
      vatAitPercent: 7.5,
      localCostIndex: 1.08,
    },
  },
];

export const BOQ_ESTIMATOR_WORKED_EXAMPLES: BoqWorkedExample[] = [
  {
    id: 'g5-residential-building-boq',
    module: 'boq-estimator',
    title: 'G+5 Residential Building Substructure & Superstructure BOQ',
    subtitle: '6-story RC frame (320 m² footprint): excavation, PCC soling, RCC footing/columns/slabs, 500W rebar, 250/125mm walls & plaster',
    category: 'Multi-Story RC',
    params: {
      currency: 'BDT',
      contingencyPercent: 5.0,
      contractorOverheadPercent: 10.0,
      vatTaxPercent: 7.5,
      aitTaxPercent: 5.0,
      retentionMoneyPercent: 7.5,
      mobilizationRecoveryPercent: 0,
      rateLibraryId: 'pwd-2024',
      regionalDistrictId: 'dhaka',
      regionalMultiplier: 1.0,
      projectDurationMonths: 14,
      retainagePercent: 5.0,
      items: [
        {
          id: 'g5-ex-101',
          wbsSectionId: 'sec-200',
          itemNo: '200.01',
          description: 'Foundation Earthwork Excavation in Soft/Medium Clay Soil (up to 2.2m depth)',
          category: 'earthwork',
          numberOfMembers: 16,
          lengthM: 2.8,
          widthM: 2.8,
          heightM: 2.1,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 0,
          unitRate: 265,
          startMonth: 1,
          durationMonths: 2,
        },
        {
          id: 'g5-ex-102',
          wbsSectionId: 'sec-300',
          itemNo: '300.01',
          description: 'PCC 1:3:6 Lean Concrete Blinding Bed below Footings & Grade Beams (Brick Khoa)',
          category: 'substructure',
          numberOfMembers: 16,
          lengthM: 2.7,
          widthM: 2.7,
          heightM: 0.1,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.5,
          unitRate: 8450,
          startMonth: 2,
          durationMonths: 1,
        },
        {
          id: 'g5-ex-103',
          wbsSectionId: 'sec-300',
          itemNo: '300.02',
          description: 'RCC 1:1.5:3 Isolated Pad Footings & Pedestal Columns (20mm Stone Chips)',
          category: 'substructure',
          numberOfMembers: 16,
          lengthM: 2.5,
          widthM: 2.5,
          heightM: 0.55,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.5,
          unitRate: 14850,
          startMonth: 2,
          durationMonths: 2,
        },
        {
          id: 'g5-ex-201',
          wbsSectionId: 'sec-400',
          itemNo: '400.01',
          description: 'RCC 1:1.5:3 Superstructure Columns & Shear Core (GF to 5th Floor)',
          category: 'superstructure',
          numberOfMembers: 96,
          lengthM: 0.45,
          widthM: 0.45,
          heightM: 3.05,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.5,
          unitRate: 15900,
          startMonth: 4,
          durationMonths: 6,
        },
        {
          id: 'g5-ex-202',
          wbsSectionId: 'sec-400',
          itemNo: '400.02',
          description: 'RCC 1:2:4 Floor Slabs & T-Beams across 6 Suspended Decks (150mm avg)',
          category: 'superstructure',
          numberOfMembers: 6,
          lengthM: 20.0,
          widthM: 16.0,
          heightM: 0.175,
          deductionQty: 18,
          unit: 'm3',
          wastagePercent: 2.5,
          unitRate: 14100,
          startMonth: 4,
          durationMonths: 7,
        },
        {
          id: 'g5-ex-301',
          wbsSectionId: 'sec-500',
          itemNo: '500.01',
          description: 'Grade 60 / 500W Deformed Steel Rebar Supply, Fabrication & Binding',
          category: 'rebar',
          numberOfMembers: 1,
          lengthM: 58.4,
          widthM: 0,
          heightM: 0,
          deductionQty: 0,
          unit: 'ton',
          wastagePercent: 3.0,
          unitRate: 118500,
          startMonth: 2,
          durationMonths: 9,
        },
        {
          id: 'g5-ex-401',
          wbsSectionId: 'sec-600',
          itemNo: '600.01',
          description: '250mm First-Class Brick Exterior & Staircase Enclosing Walls (1:6 Mortar)',
          category: 'masonry',
          numberOfMembers: 6,
          lengthM: 68.0,
          widthM: 0.25,
          heightM: 2.65,
          deductionQty: 32,
          unit: 'm3',
          wastagePercent: 3.0,
          unitRate: 9250,
          startMonth: 7,
          durationMonths: 4,
        },
        {
          id: 'g5-ex-402',
          wbsSectionId: 'sec-600',
          itemNo: '600.02',
          description: '125mm Brick Interior Partition Walls (1:4 Rich Mortar, per m²)',
          category: 'masonry',
          numberOfMembers: 6,
          lengthM: 115.0,
          widthM: 2.65,
          heightM: 0,
          deductionQty: 140,
          unit: 'm2',
          wastagePercent: 3.0,
          unitRate: 1340,
          startMonth: 8,
          durationMonths: 4,
        },
        {
          id: 'g5-ex-501',
          wbsSectionId: 'sec-700',
          itemNo: '700.01',
          description: '12mm Interior & Exterior Cement Wall Plaster (1:4 Screened Sand Mortar)',
          category: 'finishing',
          numberOfMembers: 6,
          lengthM: 340.0,
          widthM: 2.65,
          heightM: 0,
          deductionQty: 260,
          unit: 'm2',
          wastagePercent: 5.0,
          unitRate: 320,
          startMonth: 10,
          durationMonths: 4,
        },
        {
          id: 'g5-ex-502',
          wbsSectionId: 'sec-700',
          itemNo: '700.02',
          description: '1:2:4 Patent Stone / Floor Screed Concrete Topping on Parking & Roof (50mm)',
          category: 'finishing',
          numberOfMembers: 2,
          lengthM: 20.0,
          widthM: 16.0,
          heightM: 0.05,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.5,
          unitRate: 10600,
          startMonth: 12,
          durationMonths: 2,
        },
      ],
    },
  },
  {
    id: 'boundary-wall-guard-room',
    module: 'boq-estimator',
    title: 'Boundary Wall & Guard Room Estimate',
    subtitle: '140m perimeter brick compound wall + 24 m² security guard post with strip footings, tie columns & plaster',
    category: 'Site Development',
    params: {
      currency: 'BDT',
      contingencyPercent: 5.0,
      contractorOverheadPercent: 10.0,
      vatTaxPercent: 7.5,
      aitTaxPercent: 5.0,
      retentionMoneyPercent: 5.0,
      mobilizationRecoveryPercent: 0,
      rateLibraryId: 'lged-2024',
      regionalDistrictId: 'dhaka',
      regionalMultiplier: 1.0,
      projectDurationMonths: 4,
      retainagePercent: 5.0,
      items: [
        {
          id: 'bw-ex-101',
          wbsSectionId: 'sec-200',
          itemNo: '200.01',
          description: 'Perimeter Wall & Guard Room Strip Foundation Trench Excavation',
          category: 'earthwork',
          numberOfMembers: 1,
          lengthM: 158.0,
          widthM: 0.75,
          heightM: 0.9,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 0,
          unitRate: 245,
          startMonth: 1,
          durationMonths: 1,
        },
        {
          id: 'bw-ex-102',
          wbsSectionId: 'sec-300',
          itemNo: '300.01',
          description: 'PCC 1:3:6 Lean Concrete Sub-base under Strip Footings & Guard Room Floor',
          category: 'substructure',
          numberOfMembers: 1,
          lengthM: 158.0,
          widthM: 0.75,
          heightM: 0.075,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.0,
          unitRate: 8300,
          startMonth: 1,
          durationMonths: 1,
        },
        {
          id: 'bw-ex-201',
          wbsSectionId: 'sec-400',
          itemNo: '400.01',
          description: 'RCC 1:2:4 Tie Columns (3m c/c), Plinth Beam & Guard Room Roof Slab',
          category: 'superstructure',
          numberOfMembers: 1,
          lengthM: 158.0,
          widthM: 0.25,
          heightM: 0.32,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.5,
          unitRate: 13800,
          startMonth: 2,
          durationMonths: 2,
        },
        {
          id: 'bw-ex-301',
          wbsSectionId: 'sec-500',
          itemNo: '500.01',
          description: '500W Rebar Reinforcement for Tie Columns, Lintel & Guard Room Slab',
          category: 'rebar',
          numberOfMembers: 1,
          lengthM: 2.45,
          widthM: 0,
          heightM: 0,
          deductionQty: 0,
          unit: 'ton',
          wastagePercent: 2.5,
          unitRate: 116000,
          startMonth: 2,
          durationMonths: 2,
        },
        {
          id: 'bw-ex-401',
          wbsSectionId: 'sec-600',
          itemNo: '600.01',
          description: '250mm First-Class Brick Foundation & Perimeter Compound Wall (1:6 Mortar)',
          category: 'masonry',
          numberOfMembers: 1,
          lengthM: 140.0,
          widthM: 0.25,
          heightM: 2.1,
          deductionQty: 3.5,
          unit: 'm3',
          wastagePercent: 3.0,
          unitRate: 9100,
          startMonth: 2,
          durationMonths: 2,
        },
        {
          id: 'bw-ex-402',
          wbsSectionId: 'sec-600',
          itemNo: '600.02',
          description: '125mm Brick Partition & Guard Room Parapet Wall (1:4 Mortar)',
          category: 'masonry',
          numberOfMembers: 1,
          lengthM: 18.0,
          widthM: 2.75,
          heightM: 0,
          deductionQty: 4.2,
          unit: 'm2',
          wastagePercent: 3.0,
          unitRate: 1320,
          startMonth: 3,
          durationMonths: 1,
        },
        {
          id: 'bw-ex-501',
          wbsSectionId: 'sec-700',
          itemNo: '700.01',
          description: '12mm Both-Side Cement Plaster on Compound Wall & Guard Room (1:4 Mortar)',
          category: 'finishing',
          numberOfMembers: 2,
          lengthM: 158.0,
          widthM: 2.1,
          heightM: 0,
          deductionQty: 12.0,
          unit: 'm2',
          wastagePercent: 5.0,
          unitRate: 315,
          startMonth: 3,
          durationMonths: 1,
        },
        {
          id: 'bw-ex-502',
          wbsSectionId: 'sec-700',
          itemNo: '700.02',
          description: '1:2:4 Patent Stone Floor Finish inside Guard Room & Main Gate Apron (50mm)',
          category: 'finishing',
          numberOfMembers: 1,
          lengthM: 6.0,
          widthM: 4.5,
          heightM: 0.05,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.5,
          unitRate: 10500,
          startMonth: 4,
          durationMonths: 1,
        },
      ],
    },
  },
];

export const CONCRETE_MATERIALS_WORKED_EXAMPLES: ConcreteMaterialsWorkedExample[] = [
  {
    id: 'slab-100m2-m25-takeoff',
    module: 'concrete-materials',
    title: '100m² RCC Slab M25 Material Takeoff',
    subtitle: '100 m² × 150 mm suspended slab (15.0 m³) + 6 drop beams (3.6 m³), 1:1.5:3 nominal mix, 20mm stone chips, BNBC 1.54x dry factor',
    category: 'Superstructure RCC',
    params: {
      code: 'BNBC-2020',
      wetVolumeM3: 18.6,
      ratioCement: 1,
      ratioSand: 1.5,
      ratioAggregate: 3.0,
      waterCementRatio: 0.45,
      cementBagWeightKg: 50,
      cementBulkDensityKgPerM3: 1440,
      sandBulkDensityKgPerM3: 1600,
      aggregateBulkDensityKgPerM3: 1520,
      wastagePercent: 2.5,
      coarseAggregateType: 'crushed-stone',
      members: [
        {
          id: 'slab-100m2',
          name: '100m² Suspended Floor Slab (150mm)',
          shape: 'rectangular',
          count: 1,
          lengthM: 10.0,
          widthM: 10.0,
          heightM: 0.15,
          computedVolumeM3: 15.0,
        },
        {
          id: 'slab-beams',
          name: 'Floor Grade / Edge Drop Beams (300×400mm)',
          shape: 'rectangular',
          count: 6,
          lengthM: 5.0,
          widthM: 0.3,
          heightM: 0.4,
          computedVolumeM3: 0.6,
        },
      ],
    },
  },
  {
    id: 'footing-pcc-brick-khoa',
    module: 'concrete-materials',
    title: 'Raft Blinding PCC 1:3:6 (Brick Khoa)',
    subtitle: '220 m² × 100 mm sub-base (22.0 m³) with picked Jhama brick shingles (~320 bricks/m³)',
    category: 'Substructure PCC',
    params: {
      code: 'BNBC-2020',
      wetVolumeM3: 22.0,
      ratioCement: 1,
      ratioSand: 3.0,
      ratioAggregate: 6.0,
      waterCementRatio: 0.55,
      cementBagWeightKg: 50,
      wastagePercent: 3.0,
      coarseAggregateType: 'brick-shingles',
      members: [],
    },
  },
];

export const REBAR_BBS_WORKED_EXAMPLES: RebarBbsWorkedExample[] = [
  {
    id: 'two-story-col-footing-bbs',
    module: 'rebar-bbs',
    title: '2-Story Building Column & Footing BBS',
    subtitle: '12 Nos 400×400mm RC columns (8-Ø20mm + Ø10mm ductile 135° ties) batched with 12 isolated pad footing Ø16mm meshes',
    category: 'Grade 500W BBS',
    params: {
      elementType: 'column-rect',
      clearCoverMm: 40,
      rebarDensityKgPerM3: 7850,
      hookAngle: '135',
      elementCount: 12,
      lappingFactorD: 50,
      commercialBarStockLengthM: 12.0,
      steelGradeType: '500W-grade-72.5',
      seismicDuctileStirrups: true,
      colLengthMm: 400,
      colWidthMm: 400,
      colHeightM: 6.8,
      colMainBarDiaMm: 20,
      colMainBarCount: 8,
      tieBarDiaMm: 10,
      tieSpacingMm: 150,
      batchEntries: [
        {
          id: 'ftg-mesh-x',
          barMark: 'MK-F1',
          description: 'Isolated Footing X-Dir Bottom Mesh (12 Footings × 13 bars)',
          shape: 'l-hook',
          barDiaMm: 16,
          count: 156,
          spanLengthM: 2.1,
          legWidthMm: 200,
          hookAngle: '90',
        },
        {
          id: 'ftg-mesh-y',
          barMark: 'MK-F2',
          description: 'Isolated Footing Y-Dir Bottom Mesh (12 Footings × 13 bars)',
          shape: 'l-hook',
          barDiaMm: 16,
          count: 156,
          spanLengthM: 2.1,
          legWidthMm: 200,
          hookAngle: '90',
        },
      ],
    },
  },
  {
    id: 'two-way-slab-bbs-12mm',
    module: 'rebar-bbs',
    title: '6m × 5m Two-Way RCC Floor Slab Mesh',
    subtitle: '150mm slab, 25mm cover, Ø12mm main @ 150mm c/c & Ø10mm distribution @ 180mm c/c across 4 bays',
    category: 'Slab Detailing',
    params: {
      elementType: 'slab',
      clearCoverMm: 25,
      rebarDensityKgPerM3: 7850,
      hookAngle: '90',
      elementCount: 4,
      lappingFactorD: 50,
      commercialBarStockLengthM: 12.0,
      steelGradeType: '500W-grade-72.5',
      slabLengthM: 6.0,
      slabWidthM: 5.0,
      slabThicknessMm: 150,
      mainBarDiaMm: 12,
      mainBarSpacingMm: 150,
      distBarDiaMm: 10,
      distBarSpacingMm: 180,
      batchEntries: [],
    },
  },
];

export const MASONRY_WORKED_EXAMPLES: MasonryWorkedExample[] = [
  {
    id: 'apt-partition-masonry-plaster',
    module: 'masonry-finishes',
    title: 'Apartment Partition Masonry & Plaster Takeoff',
    subtitle: '42m × 3.0m 125mm BD standard brickwork (1:4 mortar), 4 openings, 12mm 2-side plaster, 600×600mm tiles & 2-coat paint',
    category: 'Masonry & Finishes',
    params: {
      wallLengthM: 42.0,
      wallHeightM: 3.0,
      wallThicknessM: 0.125,
      brickStandardType: 'bd-pwd-metric',
      wallType: '125mm-5inch-partition',
      brickLengthMm: 240,
      brickWidthMm: 115,
      brickHeightMm: 70,
      mortarJointMm: 12,
      mortarRatioCement: 1,
      mortarRatioSand: 4,
      brickWastagePercent: 5.0,
      openings: [
        { id: 'op-d1', name: 'Flush Timber Doors (1.0×2.1m)', widthM: 1.0, heightM: 2.1, count: 4, type: 'door' },
        { id: 'op-w1', name: 'Thai Aluminum Windows (1.5×1.35m)', widthM: 1.5, heightM: 1.35, count: 4, type: 'window', includeGrill: true, includeThaiAluminum: true },
      ],
      plasterThicknessMm: 12,
      plasterSides: 2,
      plasterRatioCement: 1,
      plasterRatioSand: 4,
      floorLengthM: 12.0,
      floorWidthM: 8.5,
      tileLengthMm: 600,
      tileWidthMm: 600,
      tilesPerBox: 4,
      tileWastagePercent: 5,
      puttyCoats: 2,
      paintCoats: 2,
      subbaseType: 'none',
      bfsLayerAreaM2: 0,
    },
  },
  {
    id: 'compound-wall-250mm-bfs',
    module: 'masonry-finishes',
    title: '250mm Load-Bearing Boundary Wall + BFS Soling',
    subtitle: '65m × 2.2m 10-inch wall (1:6 mortar) with 85 m² Brick Flat Soling & Picked Jhama Khoa foundation sub-base',
    category: 'Site Masonry',
    params: {
      wallLengthM: 65.0,
      wallHeightM: 2.2,
      wallThicknessM: 0.25,
      brickStandardType: 'bd-pwd-metric',
      wallType: '250mm-10inch-loadbearing',
      brickLengthMm: 240,
      brickWidthMm: 115,
      brickHeightMm: 70,
      mortarJointMm: 12,
      mortarRatioCement: 1,
      mortarRatioSand: 6,
      brickWastagePercent: 5.0,
      openings: [],
      plasterThicknessMm: 15,
      plasterSides: 2,
      plasterRatioCement: 1,
      plasterRatioSand: 5,
      floorLengthM: 0,
      floorWidthM: 0,
      subbaseType: 'bfs-flat-soling',
      bfsLayerAreaM2: 85,
      bfsSandCushionThicknessMm: 50,
      khoaConcreteVolumeM3: 6.5,
    },
  },
];

export const EARTHWORK_WORKED_EXAMPLES: EarthworkWorkedExample[] = [
  {
    id: 'village-road-500m-prismoidal',
    module: 'earthwork-alignment',
    title: '500m Village Road Embankment Prismoidal Earthwork',
    subtitle: '6.5m LGED formation, 1.5:1 side slope, 6 chainage stations (Ch 0+000 → 0+500) balancing hill Cut against low-land Fill',
    category: 'Road Alignment',
    params: {
      calculationType: 'prismoidal-road',
      soilType: 'common-earth',
      roadLengthM: 500,
      formationWidthM: 6.5,
      sideSlopeS: 1.5,
      depthStation1M: 1.2,
      depthStation2M: 1.8,
      depthStation3M: 1.1,
      haulTruckCapacityM3: 10,
      chainageStations: [
        { id: 'vr-000', chainageM: 0, cutDepthM: 0, fillHeightM: 1.2, groundCrossSlopePct: 0 },
        { id: 'vr-100', chainageM: 100, cutDepthM: 0, fillHeightM: 1.85, groundCrossSlopePct: 2 },
        { id: 'vr-200', chainageM: 200, cutDepthM: 0.45, fillHeightM: 0.85, groundCrossSlopePct: 3 },
        { id: 'vr-300', chainageM: 300, cutDepthM: 1.45, fillHeightM: 0, groundCrossSlopePct: 2 },
        { id: 'vr-400', chainageM: 400, cutDepthM: 0.95, fillHeightM: 0, groundCrossSlopePct: 0 },
        { id: 'vr-500', chainageM: 500, cutDepthM: 0, fillHeightM: 1.15, groundCrossSlopePct: 0 },
      ],
    },
  },
  {
    id: 'basement-pit-shored-excavation',
    module: 'earthwork-alignment',
    title: '18m × 14m × 3.2m Basement Pit Sloped Excavation',
    subtitle: 'Dense clay (+40% swell, 75% compaction), 0.75:1 battered side slope & 10m³ dump truck fleet haulage',
    category: 'Foundation Pit',
    params: {
      calculationType: 'pit-excavation',
      soilType: 'dense-clay',
      pitTopLengthM: 18.0,
      pitTopWidthM: 14.0,
      pitDepthM: 3.2,
      pitSideSlopeH: 0.75,
      chainageStations: [],
    },
  },
];

export const ALL_WORKED_EXAMPLES: WorkedExampleEntry[] = [
  ...BEAM_WORKED_EXAMPLES,
  ...CONTINUOUS_BEAM_WORKED_EXAMPLES,
  ...RATE_ANALYSIS_WORKED_EXAMPLES,
  ...BOQ_ESTIMATOR_WORKED_EXAMPLES,
  ...CONCRETE_MATERIALS_WORKED_EXAMPLES,
  ...REBAR_BBS_WORKED_EXAMPLES,
  ...MASONRY_WORKED_EXAMPLES,
  ...EARTHWORK_WORKED_EXAMPLES,
];

export type DeepLinkModuleId =
  | 'beam-analysis'
  | 'continuous-beam'
  | 'rate-analysis'
  | 'boq-estimator'
  | 'concrete-materials'
  | 'rebar-bbs'
  | 'masonry-finishes'
  | 'earthwork-alignment';

export interface ParsedDeepLink {
  module?: DeepLinkModuleId;
  exampleId?: string;
  overrides: {
    L?: number;
    q?: number;
    P?: number;
    a?: number;
  };
}

/**
 * Safely parses URL query parameters (?module=beam-analysis&example=ss-udl-6m&q=10)
 * without touching verification routes (?verify, ?docToken, etc.).
 */
export function parseStructuralDeepLink(search: string): ParsedDeepLink | null {
  if (!search) return null;
  const sp = new URLSearchParams(search);
  const rawModule = sp.get('module');
  const rawExample = sp.get('example');

  const L = sp.has('L') ? Number(sp.get('L')) : undefined;
  const q = sp.has('q') ? Number(sp.get('q')) : undefined;
  const P = sp.has('P') ? Number(sp.get('P')) : undefined;
  const a = sp.has('a') ? Number(sp.get('a')) : undefined;

  const hasValidOverrides =
    (L !== undefined && Number.isFinite(L) && L > 0 && L <= 100) ||
    (q !== undefined && Number.isFinite(q) && q >= 0 && q <= 2000) ||
    (P !== undefined && Number.isFinite(P) && P >= 0 && P <= 5000) ||
    (a !== undefined && Number.isFinite(a) && a >= 0 && a <= 100);

  const moduleValid: DeepLinkModuleId | undefined =
    rawModule === 'beam-analysis' ||
    rawModule === 'continuous-beam' ||
    rawModule === 'rate-analysis' ||
    rawModule === 'boq-estimator' ||
    rawModule === 'concrete-materials' ||
    rawModule === 'rebar-bbs' ||
    rawModule === 'masonry-finishes' ||
    rawModule === 'earthwork-alignment'
      ? rawModule
      : undefined;

  if (!moduleValid && !rawExample && !hasValidOverrides) {
    return null;
  }

  return {
    module: moduleValid,
    exampleId: rawExample || undefined,
    overrides: {
      ...(L !== undefined && Number.isFinite(L) && L > 0 && L <= 100 ? { L } : {}),
      ...(q !== undefined && Number.isFinite(q) && q >= 0 && q <= 2000 ? { q } : {}),
      ...(P !== undefined && Number.isFinite(P) && P >= 0 && P <= 5000 ? { P } : {}),
      ...(a !== undefined && Number.isFinite(a) && a >= 0 && a <= 100 ? { a } : {}),
    },
  };
}

export function buildWorkedExampleUrl(
  moduleKey: DeepLinkModuleId,
  exampleId: string,
  beamOverrides?: Partial<BeamParameters>
): string {
  const url = new URL(window.location.href);
  url.searchParams.delete('verify');
  url.searchParams.delete('token');
  url.searchParams.delete('docToken');
  url.searchParams.delete('verifyDoc');
  url.searchParams.set('module', moduleKey);
  url.searchParams.set('example', exampleId);
  if (moduleKey === 'beam-analysis' && beamOverrides) {
    if (typeof beamOverrides.spanLengthM === 'number') {
      url.searchParams.set('L', String(beamOverrides.spanLengthM));
    }
    if (typeof beamOverrides.uniformLoadKnPerM === 'number') {
      url.searchParams.set('q', String(beamOverrides.uniformLoadKnPerM));
    }
    if (typeof beamOverrides.pointLoadKn === 'number' && beamOverrides.pointLoadKn > 0) {
      url.searchParams.set('P', String(beamOverrides.pointLoadKn));
    } else {
      url.searchParams.delete('P');
    }
  } else {
    url.searchParams.delete('L');
    url.searchParams.delete('q');
    url.searchParams.delete('P');
  }
  return url.toString();
}
