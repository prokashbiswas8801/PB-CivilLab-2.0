import {
  CivilLabSchemaV2,
  CivilWorkspace,
  CalculationRecord,
  TakeoffLineItem,
  LegacySchemaV1,
  CustomUnitDefinition,
  UnitSystemPreset,
  WorkspaceUnitPreferences,
  UserProfile,
  UserCustomPreferences,
  EngineeringPreset,
} from '../types/civil';
import { persistToIndexedDB, clearIndexedDB, loadFromIndexedDB } from './indexedStorage';

export const STORAGE_KEY = 'pb_civillab_state_v2';
export const LEGACY_V1_KEY = 'pb_civillab_state_v1';
export const CURRENT_SCHEMA_VERSION = 2 as const;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createDefaultCustomUnits(): CustomUnitDefinition[] {
  return [
    {
      id: 'custom_bigha_rajshahi',
      name: 'Rajshahi Bigha (Local Land Unit)',
      symbol: 'bigha (Raj)',
      category: 'area',
      toBaseFactor: 1600.0, // 1600 m² local customary
      description: 'Regional Rajshahi land measure (~39.54 decimals)',
    },
    {
      id: 'custom_crushed_stone_truck',
      name: 'Dump Truck Tipper (Standard)',
      symbol: 'tipper',
      category: 'volume',
      toBaseFactor: 10.0, // 10 m³
      description: 'Standard 3-axle 10 m³ aggregate hauling tipper',
    },
  ];
}

export function createSampleBOQItems(): TakeoffLineItem[] {
  return [
    {
      id: 'takeoff-1',
      itemNo: '1.01',
      description: 'Earth excavation in foundation pits in common soil (4 Footings)',
      category: 'earthwork',
      numberOfMembers: 4,
      lengthM: 3.5,
      widthM: 3.5,
      heightM: 2.0,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 5.0,
      unitRate: 450,
    },
    {
      id: 'takeoff-2',
      itemNo: '2.01',
      description: 'Single layer brick flat soling (BFS) with picked jhama bricks',
      category: 'substructure',
      numberOfMembers: 4,
      lengthM: 3.5,
      widthM: 3.5,
      heightM: 0,
      deductionQty: 0,
      unit: 'm2',
      wastagePercent: 3.0,
      unitRate: 650,
    },
    {
      id: 'takeoff-3',
      itemNo: '2.02',
      description: 'PCC (1:3:6) lean concrete bedding beneath footings (75mm thick)',
      category: 'substructure',
      numberOfMembers: 4,
      lengthM: 3.5,
      widthM: 3.5,
      heightM: 0.075,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 3.0,
      unitRate: 8500,
    },
    {
      id: 'takeoff-4',
      itemNo: '3.01',
      description: 'RCC (1:1.5:3) in isolated column footings including centering & shuttering',
      category: 'substructure',
      numberOfMembers: 4,
      lengthM: 3.0,
      widthM: 3.0,
      heightM: 0.65,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 2.5,
      unitRate: 14200,
    },
    {
      id: 'takeoff-5',
      itemNo: '3.02',
      description: 'RCC (1:1.5:3) in pedestal columns from footing top to plinth level',
      category: 'superstructure',
      numberOfMembers: 4,
      lengthM: 0.5,
      widthM: 0.5,
      heightM: 2.4,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 2.0,
      unitRate: 15800,
    },
    {
      id: 'takeoff-6',
      itemNo: '4.01',
      description: 'Deformed High Yield Rebar (Grade 60/500W) in substructure & columns',
      category: 'rebar',
      numberOfMembers: 1,
      lengthM: 3450,
      widthM: 0,
      heightM: 0,
      deductionQty: 0,
      unit: 'kg',
      wastagePercent: 3.0,
      unitRate: 108,
    },
    {
      id: 'takeoff-7',
      itemNo: '5.01',
      description: 'First class brickwork (1:6 cement mortar) in plinth foundation walls',
      category: 'masonry',
      numberOfMembers: 2,
      lengthM: 18.0,
      widthM: 0.25,
      heightM: 1.2,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 4.0,
      unitRate: 9800,
    },
  ];
}

export function createDefaultWorkspaces(): CivilWorkspace[] {
  const now = new Date().toISOString();
  return [
    {
      id: generateUUID(),
      name: 'Primary Civil Engineering Project',
      projectCode: 'CIV-2026-001',
      siteLocation: 'Main Construction Sector',
      engineerOfRecord: 'P. Biswas, PE',
      createdAt: now,
      updatedAt: now,
      activeModule: 'boq-estimator',
      governingCode: 'BNBC-2020',
      currency: 'BDT',
      boq: {
        currency: 'BDT',
        contingencyPercent: 3.0,
        contractorOverheadPercent: 10.0,
        vatTaxPercent: 7.5,
        items: [],
      },
      rateAnalysis: {
        workType: 'rcc-1-1.5-3',
        basisVolumeM3: 1.0,
        currency: 'BDT',
        cementPricePerBag: 560,
        sandPricePerM3: 1800,
        stoneChipsPricePerM3: 6200,
        rebarPricePerKg: 108,
        rebarAllowanceKgPerM3: 100,
        admixturePricePerKg: 220,
        admixtureDoseKgPerM3: 2.5,
        brickPricePer1000: 12500,
        masonDailyWage: 1100,
        masonDaysRequired: 0.35,
        laborerDailyWage: 650,
        laborerDaysRequired: 1.8,
        barBenderDailyWage: 950,
        barBenderDaysRequired: 0.45,
        mixerHirePerM3: 350,
        vibratorHirePerM3: 180,
        shutteringScaffoldingPerM3: 1400,
        waterElectricityPercent: 1.5,
        contractorProfitPercent: 10.0,
      },
      converter: {
        category: 'volume',
        fromUnit: 'm3',
        toUnit: 'cft',
        inputValue: 15.0,
        feetInchRawString: "12'--4 1/2\"",
      },
      beam: {
        spanLengthM: 12.5,
        uniformLoadKnPerM: 28.0,
        pointLoadKn: 85.0,
        pointLoadPositionM: 6.25,
        elasticModulusGpa: 200,
        momentOfInertiaCm4: 118000,
        supportCondition: 'simply-supported',
        allowableStressMpa: 250,
        sectionDepthMm: 600,
      },
      bearing: {
        footingShape: 'square',
        footingWidthM: 3.2,
        embedmentDepthM: 1.8,
        soilCohesionKpa: 24,
        frictionAngleDeg: 32,
        unitWeightKnPerM3: 18.5,
        waterTableDepthM: 3.5,
        factorOfSafety: 3.0,
        appliedColumnLoadKn: 2450,
      },
      concrete: {
        targetStrengthMpa: 40,
        waterCementRatio: 0.42,
        slumpMm: 100,
        maxAggregateSizeMm: 20,
        cementSpecificGravity: 3.15,
        fineAggSpecificGravity: 2.65,
        coarseAggSpecificGravity: 2.7,
        airEntrainmentPercent: 2.0,
        batchVolumeM3: 1.0,
      },
      channel: {
        bottomWidthM: 2.4,
        sideSlopeZ: 1.5,
        flowDepthM: 1.35,
        bedSlope: 0.0018,
        manningN: 0.015,
        freeboardRequirementM: 0.45,
      },
      concreteMaterials: {
        code: 'BNBC-2020',
        wetVolumeM3: 25.0,
        ratioCement: 1,
        ratioSand: 1.5,
        ratioAggregate: 3,
        waterCementRatio: 0.45,
        cementBagWeightKg: 50,
        cementBulkDensityKgPerM3: 1440,
        sandBulkDensityKgPerM3: 1600,
        aggregateBulkDensityKgPerM3: 1520,
        customDryFactor: 1.54,
        wastagePercent: 3.0,
      },
      rebarBbs: {
        elementType: 'slab',
        clearCoverMm: 20,
        rebarDensityKgPerM3: 7850,
        hookAngle: '90',
        slabLengthM: 6.0,
        slabWidthM: 4.5,
        slabThicknessMm: 150,
        mainBarDiaMm: 12,
        mainBarSpacingMm: 150,
        distBarDiaMm: 10,
        distBarSpacingMm: 175,
        colLengthMm: 450,
        colWidthMm: 450,
        colHeightM: 3.6,
        colMainBarDiaMm: 20,
        colMainBarCount: 8,
        tieBarDiaMm: 10,
        tieSpacingMm: 150,
        circColDiaMm: 500,
        circColHeightM: 3.6,
        circMainBarDiaMm: 20,
        circMainBarCount: 8,
        spiralTieDiaMm: 10,
        spiralPitchMm: 75,
        footingLengthM: 2.5,
        footingWidthM: 2.5,
        footingDepthMm: 600,
        footingBarDiaMm: 16,
        footingBarSpacingMm: 150,
        stairGoingM: 3.0,
        stairTotalRiseM: 1.8,
        waistSlabThicknessMm: 150,
        riserMm: 150,
        treadMm: 250,
        landingLengthM: 1.2,
        stairMainBarDiaMm: 12,
        stairMainBarSpacingMm: 125,
        stairDistBarDiaMm: 10,
        stairDistBarSpacingMm: 150,
      },
      masonry: {
        wallLengthM: 12.0,
        wallHeightM: 3.2,
        wallThicknessM: 0.25,
        brickLengthMm: 240,
        brickWidthMm: 115,
        brickHeightMm: 70,
        mortarJointMm: 10,
        mortarRatioCement: 1,
        mortarRatioSand: 5,
        brickWastagePercent: 5,
        openings: [
          { id: 'op-1', name: 'Main Entry Door (D1)', widthM: 1.2, heightM: 2.1, count: 1 },
          { id: 'op-2', name: 'Standard Window (W1)', widthM: 1.5, heightM: 1.35, count: 2 },
        ],
        plasterThicknessMm: 12,
        plasterSides: 2,
        plasterRatioCement: 1,
        plasterRatioSand: 4,
        floorLengthM: 8.0,
        floorWidthM: 6.0,
        tileLengthMm: 600,
        tileWidthMm: 600,
        tilesPerBox: 4,
        tileWastagePercent: 5,
      },
      earthwork: {
        calculationType: 'pit-excavation',
        soilType: 'common-earth',
        pitTopLengthM: 14.0,
        pitTopWidthM: 10.0,
        pitDepthM: 2.8,
        pitSideSlopeH: 0.5,
        trenchLengthM: 45.0,
        trenchBottomWidthM: 1.5,
        trenchDepthM: 1.8,
        trenchSideSlopeH: 0.5,
        roadLengthM: 120.0,
        formationWidthM: 10.0,
        sideSlopeS: 1.5,
        depthStation1M: 1.2,
        depthStation2M: 2.1,
        depthStation3M: 1.6,
        customSwellPercent: 25,
        customShrinkagePercent: 80,
      },
      unitPreferences: {
        systemPreset: 'metric',
        fieldUnits: {},
        outputUnits: {},
      },
    },
  ];
}

export function createInitialHistory(workspaces: CivilWorkspace[]): CalculationRecord[] {
  const primary = workspaces[0];
  const now = Date.now();

  return [
    {
      id: generateUUID(),
      workspaceId: primary.id,
      moduleId: 'unit-converter',
      timestamp: new Date(now - 1000 * 60 * 50).toISOString(),
      title: 'Structural Volume Conversion 15 m³ ⇄ CFT',
      notes: 'High-precision conversion using 35.3147 CFT/m³ conversion constant.',
      status: 'nominal',
      keyMetrics: [
        { label: 'Input Volume', value: '15.00', unit: 'm³' },
        { label: 'Result CFT', value: '529.72', unit: 'CFT' },
        { label: 'Category', value: 'Volume', unit: 'SI→Imp' },
      ],
      inputsSnapshot: {
        from: 'm3',
        to: 'cft',
        value: 15,
      },
    },
    {
      id: generateUUID(),
      workspaceId: primary.id,
      moduleId: 'concrete-materials',
      timestamp: new Date(now - 1000 * 60 * 42).toISOString(),
      title: 'Pier P14 Superstructure Pour Estimate',
      notes: 'BNBC 2020 volumetric mix 1:1.5:3 with 1.54 dry factor and 3% wastage.',
      status: 'nominal',
      keyMetrics: [
        { label: 'Dry Vol', value: '39.66', unit: 'm³' },
        { label: 'Cement Bags', value: '207.7', unit: 'bags (50kg)' },
        { label: 'Sand Volume', value: '381.8', unit: 'cft' },
      ],
      inputsSnapshot: {
        code: 'BNBC-2020',
        wetVolumeM3: 25.0,
        ratio: '1:1.5:3',
      },
    },
  ];
}

export function createDemoWorkspaces(): CivilWorkspace[] {
  const base = createDefaultWorkspaces()[0];
  const now = new Date().toISOString();
  return [
    {
      ...base,
      id: generateUUID(),
      name: 'Padma River Viaduct — Pier P14',
      projectCode: 'CIV-2026-P14',
      siteLocation: 'Sector 4 North Abutment',
      engineerOfRecord: 'P. Biswas, PE',
      createdAt: now,
      updatedAt: now,
      boq: {
        ...base.boq,
        items: createSampleBOQItems(),
      },
    },
  ];
}

export function createDefaultUserProfile(): UserProfile {
  return {
    fullName: 'Engr. Prokash Biswas, PE',
    designation: 'Senior Structural Engineer',
    organization: 'PB CivilLab Consultancy',
    role: 'structural-engineer',
    licenseNumber: 'IEB PE-41892',
    email: 'prokashbiswas8801@gmail.com',
    phone: '+880 1712-345678',
    initials: 'PB',
    bio: 'Civil & Structural Design Engineer specializing in reinforced concrete, geotechnical foundations, and infrastructure project cost engineering.',
  };
}

export function createDefaultUserPreferences(): UserCustomPreferences {
  return {
    preferredUnitSystem: 'metric',
    decimalPrecision: 2,
    defaultCementBagWeightKg: 50,
    defaultCurrency: 'BDT',
    defaultBuildingCode: 'BNBC-2020',
    wastage: {
      concretePercent: 3.0,
      rebarPercent: 5.0,
      brickMortarPercent: 5.0,
      earthworkShrinkagePercent: 10.0,
    },
    regionalLand: {
      kathaSquareFeet: 720,
      decimalSquareFeet: 435.6,
      bighaDecimals: 33,
      defaultLandUnit: 'decimal',
    },
    reportHeaderNote: 'Verified for preliminary structural & estimation design under BNBC-2020 / ACI-318 standards.',
    showEngineeringSignatureLine: true,
    autoLogSnapshotsOnPrint: true,
    compactNumberFormatting: false,
  };
}

export function createDefaultEngineeringPresets(): EngineeringPreset[] {
  const now = '2026-01-01T00:00:00.000Z';
  return [
    {
      id: 'preset-concrete-m25-structural',
      name: 'M25 Structural RCC Mix (1:1:2)',
      description: 'High-strength structural concrete for heavy columns, transfer slabs, and pile caps. Target strength 25-32 MPa, w/c 0.42.',
      category: 'concrete-mix',
      tags: ['BNBC-2020', 'RCC', 'Columns', 'M25'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'PB CivilLab Standards',
      payload: {
        targetModule: 'concrete-materials',
        concreteMaterials: {
          code: 'BNBC-2020',
          wetVolumeM3: 20.0,
          ratioCement: 1,
          ratioSand: 1.0,
          ratioAggregate: 2.0,
          waterCementRatio: 0.42,
          cementBagWeightKg: 50,
          cementBulkDensityKgPerM3: 1440,
          sandBulkDensityKgPerM3: 1600,
          aggregateBulkDensityKgPerM3: 1520,
          customDryFactor: 1.54,
          wastagePercent: 3.0,
        },
        concreteMix: {
          targetStrengthMpa: 30,
          waterCementRatio: 0.42,
          slumpMm: 100,
          maxAggregateSizeMm: 20,
          cementSpecificGravity: 3.15,
          fineAggSpecificGravity: 2.65,
          coarseAggSpecificGravity: 2.7,
          airEntrainmentPercent: 2.0,
          batchVolumeM3: 1.0,
        },
      },
    },
    {
      id: 'preset-concrete-m20-nominal',
      name: 'M20 Standard RCC Mix (1:1.5:3)',
      description: 'Standard residential/commercial floor slabs, grade beams, and lintels. Nominal target strength 20 MPa, w/c 0.45.',
      category: 'concrete-mix',
      tags: ['BNBC-2020', 'Slabs', 'Beams', 'M20', 'Residential'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'PB CivilLab Standards',
      payload: {
        targetModule: 'concrete-materials',
        concreteMaterials: {
          code: 'BNBC-2020',
          wetVolumeM3: 25.0,
          ratioCement: 1,
          ratioSand: 1.5,
          ratioAggregate: 3.0,
          waterCementRatio: 0.45,
          cementBagWeightKg: 50,
          cementBulkDensityKgPerM3: 1440,
          sandBulkDensityKgPerM3: 1600,
          aggregateBulkDensityKgPerM3: 1520,
          customDryFactor: 1.54,
          wastagePercent: 3.0,
        },
      },
    },
    {
      id: 'preset-concrete-m15-lean',
      name: 'M15 Mass Blinding Bed (1:2:4)',
      description: 'Lean concrete sub-base, footing blinding bed, and floor soling PCC. w/c 0.50, low cement requirement.',
      category: 'concrete-mix',
      tags: ['PCC', 'Blinding', 'Footing Bed', 'M15'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'PB CivilLab Standards',
      payload: {
        targetModule: 'concrete-materials',
        concreteMaterials: {
          code: 'BNBC-2020',
          wetVolumeM3: 15.0,
          ratioCement: 1,
          ratioSand: 2.0,
          ratioAggregate: 4.0,
          waterCementRatio: 0.50,
          cementBagWeightKg: 50,
          cementBulkDensityKgPerM3: 1440,
          sandBulkDensityKgPerM3: 1550,
          aggregateBulkDensityKgPerM3: 1480,
          customDryFactor: 1.54,
          wastagePercent: 4.0,
        },
      },
    },
    {
      id: 'preset-rates-pwd-2024',
      name: 'PWD Standard Rate Schedule 2024 (BDT)',
      description: 'Official Public Works Department baseline rates for government and public infrastructure works.',
      category: 'material-rates',
      tags: ['PWD', 'Bangladesh', 'Official', 'BDT', 'Rates'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'PWD Baseline',
      payload: {
        targetModule: 'rate-analysis',
        rateAnalysis: {
          currency: 'BDT',
          workType: 'rcc-1-1.5-3',
          cementPricePerBag: 580,
          sandPricePerM3: 1590,
          stoneChipsPricePerM3: 8480,
          rebarPricePerKg: 108,
          rebarAllowanceKgPerM3: 100,
          admixturePricePerKg: 220,
          admixtureDoseKgPerM3: 2.5,
          brickPricePer1000: 12500,
          masonDailyWage: 1100,
          masonDaysRequired: 0.35,
          laborerDailyWage: 650,
          laborerDaysRequired: 1.8,
          barBenderDailyWage: 950,
          barBenderDaysRequired: 0.45,
          mixerHirePerM3: 350,
          vibratorHirePerM3: 180,
          shutteringScaffoldingPerM3: 1400,
          waterElectricityPercent: 1.5,
          contractorProfitPercent: 10.0,
        },
      },
    },
    {
      id: 'preset-rates-metro-private',
      name: 'Urban Commercial High-Grade Rates (Metro BDT)',
      description: 'Current urban private commercial market rates with Sylhet coarse sand and 500W deformed rebar.',
      category: 'material-rates',
      tags: ['Commercial', 'Metro', 'Sylhet Sand', 'High-Grade'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Market Survey 2026',
      payload: {
        targetModule: 'rate-analysis',
        rateAnalysis: {
          currency: 'BDT',
          workType: 'rcc-1-1.5-3',
          cementPricePerBag: 640,
          sandPricePerM3: 2295,
          stoneChipsPricePerM3: 9710,
          rebarPricePerKg: 116,
          rebarAllowanceKgPerM3: 120,
          admixturePricePerKg: 260,
          admixtureDoseKgPerM3: 3.0,
          brickPricePer1000: 14500,
          masonDailyWage: 1300,
          masonDaysRequired: 0.38,
          laborerDailyWage: 750,
          laborerDaysRequired: 2.0,
          barBenderDailyWage: 1100,
          barBenderDaysRequired: 0.5,
          mixerHirePerM3: 420,
          vibratorHirePerM3: 220,
          shutteringScaffoldingPerM3: 1650,
          waterElectricityPercent: 2.0,
          contractorProfitPercent: 12.0,
        },
      },
    },
    {
      id: 'preset-beam-secondary-6m',
      name: 'Secondary Floor Beam 6.0m (Simply-Supported)',
      description: 'Standard 250x450mm floor beam under residential dead & live load (UDL 18 kN/m, Point Load 25 kN).',
      category: 'structural-beam',
      tags: ['Beam', 'Floor', '6m', 'Residential'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'PB CivilLab Structural',
      payload: {
        targetModule: 'beam-analysis',
        beam: {
          spanLengthM: 6.0,
          uniformLoadKnPerM: 18.0,
          pointLoadKn: 25.0,
          pointLoadPositionM: 3.0,
          elasticModulusGpa: 25,
          momentOfInertiaCm4: 190000,
          supportCondition: 'simply-supported',
          allowableStressMpa: 200,
          sectionDepthMm: 450,
        },
      },
    },
    {
      id: 'preset-beam-transfer-12m',
      name: 'Heavy Transfer Girder 12.5m (Fixed-Ends)',
      description: 'Deep 400x750mm commercial transfer girder supporting column loads over open atrium.',
      category: 'structural-beam',
      tags: ['Girder', 'Transfer', 'Commercial', 'Heavy'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'PB CivilLab Structural',
      payload: {
        targetModule: 'beam-analysis',
        beam: {
          spanLengthM: 12.5,
          uniformLoadKnPerM: 32.0,
          pointLoadKn: 120.0,
          pointLoadPositionM: 6.25,
          elasticModulusGpa: 28,
          momentOfInertiaCm4: 1400000,
          supportCondition: 'fixed-ends',
          allowableStressMpa: 250,
          sectionDepthMm: 750,
        },
      },
    },
    {
      id: 'preset-soil-dense-sand',
      name: 'Dense Sand & Gravel High Bearing Capacity',
      description: 'Dense granular subsoil with friction angle 36°, 1.8m embedment, applied column load 2800 kN.',
      category: 'bearing-soil',
      tags: ['Geotechnical', 'Sand', 'Footing', 'High Capacity'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Geotech Baseline',
      payload: {
        targetModule: 'bearing-capacity',
        bearing: {
          footingShape: 'square',
          footingWidthM: 2.8,
          embedmentDepthM: 1.8,
          soilCohesionKpa: 8,
          frictionAngleDeg: 36,
          unitWeightKnPerM3: 19.5,
          waterTableDepthM: 4.0,
          factorOfSafety: 3.0,
          appliedColumnLoadKn: 2800,
        },
      },
    },
    {
      id: 'preset-soil-deltaic-clay',
      name: 'Soft-Medium Deltaic Clay (Cohesive)',
      description: 'Deltaic alluvial clay with high cohesion (35 kPa), low friction (18°), shallow water table.',
      category: 'bearing-soil',
      tags: ['Geotechnical', 'Alluvial Clay', 'Deltaic', 'BNBC'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Geotech Baseline',
      payload: {
        targetModule: 'bearing-capacity',
        bearing: {
          footingShape: 'square',
          footingWidthM: 3.5,
          embedmentDepthM: 2.0,
          soilCohesionKpa: 35,
          frictionAngleDeg: 18,
          unitWeightKnPerM3: 17.5,
          waterTableDepthM: 1.5,
          factorOfSafety: 3.0,
          appliedColumnLoadKn: 1850,
        },
      },
    },
    {
      id: 'preset-channel-lined-drain',
      name: 'Concrete-Lined Storm Drain (Manning n=0.013)',
      description: 'Smooth troweled concrete trapezoidal storm channel with 1:1 side slopes, bed slope 0.002.',
      category: 'earthwork-hydraulics',
      tags: ['Hydraulics', 'Storm Drain', 'Concrete', 'Urban Drainage'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Hydraulics Standards',
      payload: {
        targetModule: 'open-channel',
        channel: {
          bottomWidthM: 1.8,
          sideSlopeZ: 1.0,
          flowDepthM: 1.2,
          bedSlope: 0.002,
          manningN: 0.013,
          freeboardRequirementM: 0.4,
        },
      },
    },
  ];
}

export function createCleanSchemaV2(): CivilLabSchemaV2 {
  const workspaces = createDefaultWorkspaces();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastMigratedAt: new Date().toISOString(),
    migratedFromVersion: null,
    themePreference: 'system',
    sidebarCollapsed: false,
    splitRatioPercent: 44,
    activeWorkspaceId: workspaces[0].id,
    customUnits: createDefaultCustomUnits(),
    commandRecentQueries: ['cft', 'katha', 'rebar', '12-4 1/2'],
    workspaces,
    calculationHistory: [],
    userProfile: createDefaultUserProfile(),
    userPreferences: createDefaultUserPreferences(),
    presets: createDefaultEngineeringPresets(),
  };
}

export function createDemoSchemaV2(): CivilLabSchemaV2 {
  const workspaces = createDemoWorkspaces();
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastMigratedAt: new Date().toISOString(),
    migratedFromVersion: null,
    themePreference: 'system',
    sidebarCollapsed: false,
    splitRatioPercent: 44,
    activeWorkspaceId: workspaces[0].id,
    customUnits: createDefaultCustomUnits(),
    commandRecentQueries: ['cft', 'katha', 'rebar', '12-4 1/2'],
    workspaces,
    calculationHistory: createInitialHistory(workspaces),
    userProfile: createDefaultUserProfile(),
    userPreferences: createDefaultUserPreferences(),
    presets: createDefaultEngineeringPresets(),
  };
}

export function createDefaultSchemaV2(): CivilLabSchemaV2 {
  return createCleanSchemaV2();
}

export function migrateToSchemaV2(rawUnknown: unknown, sourceVersion: number): CivilLabSchemaV2 {
  const base = createDefaultSchemaV2();
  if (!rawUnknown || typeof rawUnknown !== 'object') {
    return base;
  }

  const legacy = rawUnknown as LegacySchemaV1 & Partial<CivilLabSchemaV2>;
  const now = new Date().toISOString();

  const migratedWorkspaceId = generateUUID();
  const basePrimary = base.workspaces[0];

  const migratedWorkspace: CivilWorkspace = {
    ...basePrimary,
    id: migratedWorkspaceId,
    name:
      typeof legacy.projectName === 'string' && legacy.projectName.trim().length > 0
        ? legacy.projectName.trim()
        : basePrimary.name,
    projectCode:
      typeof legacy.projectCode === 'string' && legacy.projectCode.trim().length > 0
        ? legacy.projectCode.trim()
        : 'MIG-V1-2026',
    updatedAt: now,
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastMigratedAt: now,
    migratedFromVersion: sourceVersion,
    themePreference:
      legacy.theme === 'light' || legacy.theme === 'dark' || legacy.theme === 'system'
        ? legacy.theme
        : base.themePreference,
    sidebarCollapsed: Boolean(legacy.sidebarCollapsed),
    splitRatioPercent:
      typeof legacy.splitRatioPercent === 'number'
        ? Math.min(65, Math.max(30, legacy.splitRatioPercent))
        : 44,
    activeWorkspaceId: migratedWorkspaceId,
    customUnits: base.customUnits,
    commandRecentQueries: base.commandRecentQueries,
    workspaces: [migratedWorkspace, ...base.workspaces.slice(1)],
    calculationHistory: base.calculationHistory,
  };
}

export function validateAndNormalizeV2(candidate: Partial<CivilLabSchemaV2>): CivilLabSchemaV2 {
  const fallback = createDefaultSchemaV2();

  const validWorkspaces =
    Array.isArray(candidate.workspaces) && candidate.workspaces.length > 0
      ? candidate.workspaces.map((ws) => ({
          ...fallback.workspaces[0],
          ...ws,
          id: typeof ws.id === 'string' && ws.id.length >= 8 ? ws.id : generateUUID(),
          governingCode: ws.governingCode || fallback.workspaces[0].governingCode,
          currency: ws.currency || fallback.workspaces[0].currency || 'BDT',
          boq: {
            ...fallback.workspaces[0].boq,
            ...(ws.boq || {}),
            items: Array.isArray(ws.boq?.items)
              ? ws.boq.items
              : fallback.workspaces[0].boq.items,
          },
          rateAnalysis: { ...fallback.workspaces[0].rateAnalysis, ...(ws.rateAnalysis || {}) },
          converter: { ...fallback.workspaces[0].converter, ...(ws.converter || {}) },
          beam: { ...fallback.workspaces[0].beam, ...(ws.beam || {}) },
          bearing: { ...fallback.workspaces[0].bearing, ...(ws.bearing || {}) },
          concrete: { ...fallback.workspaces[0].concrete, ...(ws.concrete || {}) },
          channel: { ...fallback.workspaces[0].channel, ...(ws.channel || {}) },
          concreteMaterials: { ...fallback.workspaces[0].concreteMaterials, ...(ws.concreteMaterials || {}) },
          rebarBbs: { ...fallback.workspaces[0].rebarBbs, ...(ws.rebarBbs || {}) },
          masonry: { ...fallback.workspaces[0].masonry, ...(ws.masonry || {}) },
          earthwork: { ...fallback.workspaces[0].earthwork, ...(ws.earthwork || {}) },
          unitPreferences: {
            systemPreset: (ws.unitPreferences?.systemPreset === 'imperial' || ws.unitPreferences?.systemPreset === 'regional' || ws.unitPreferences?.systemPreset === 'custom'
              ? ws.unitPreferences.systemPreset
              : 'metric') as UnitSystemPreset,
            fieldUnits: ws.unitPreferences?.fieldUnits || {},
            outputUnits: ws.unitPreferences?.outputUnits || {},
          },
        }))
      : fallback.workspaces;

  const activeIdExists = validWorkspaces.some((w) => w.id === candidate.activeWorkspaceId);

  const validHistory = Array.isArray(candidate.calculationHistory)
    ? candidate.calculationHistory.map((rec) => ({
        ...rec,
        id: typeof rec.id === 'string' && rec.id.length >= 8 ? rec.id : generateUUID(),
      }))
    : [];

  const validUserProfile: UserProfile = candidate.userProfile
    ? {
        fullName:
          typeof candidate.userProfile.fullName === 'string' &&
          candidate.userProfile.fullName.trim().length > 0
            ? candidate.userProfile.fullName.trim()
            : fallback.userProfile?.fullName || 'Engr. Prokash Biswas, PE',
        designation:
          typeof candidate.userProfile.designation === 'string' &&
          candidate.userProfile.designation.trim().length > 0
            ? candidate.userProfile.designation.trim()
            : fallback.userProfile?.designation || 'Senior Structural Engineer',
        organization:
          typeof candidate.userProfile.organization === 'string' &&
          candidate.userProfile.organization.trim().length > 0
            ? candidate.userProfile.organization.trim()
            : fallback.userProfile?.organization || 'PB CivilLab Consultancy',
        role: candidate.userProfile.role || fallback.userProfile?.role || 'structural-engineer',
        licenseNumber: candidate.userProfile.licenseNumber ?? fallback.userProfile?.licenseNumber,
        email: candidate.userProfile.email ?? fallback.userProfile?.email,
        phone: candidate.userProfile.phone ?? fallback.userProfile?.phone,
        initials: candidate.userProfile.initials ?? fallback.userProfile?.initials,
        bio: candidate.userProfile.bio ?? fallback.userProfile?.bio,
      }
    : (fallback.userProfile || createDefaultUserProfile());

  const validUserPreferences: UserCustomPreferences = candidate.userPreferences
    ? {
        preferredUnitSystem: candidate.userPreferences.preferredUnitSystem || 'metric',
        decimalPrecision:
          typeof candidate.userPreferences.decimalPrecision === 'number'
            ? Math.min(4, Math.max(0, Math.floor(candidate.userPreferences.decimalPrecision)))
            : 2,
        defaultCementBagWeightKg:
          typeof candidate.userPreferences.defaultCementBagWeightKg === 'number' &&
          candidate.userPreferences.defaultCementBagWeightKg > 0
            ? candidate.userPreferences.defaultCementBagWeightKg
            : 50,
        defaultCurrency: candidate.userPreferences.defaultCurrency || 'BDT',
        defaultBuildingCode: candidate.userPreferences.defaultBuildingCode || 'BNBC-2020',
        wastage: {
          concretePercent:
            typeof candidate.userPreferences.wastage?.concretePercent === 'number'
              ? Math.max(0, candidate.userPreferences.wastage.concretePercent)
              : 3.0,
          rebarPercent:
            typeof candidate.userPreferences.wastage?.rebarPercent === 'number'
              ? Math.max(0, candidate.userPreferences.wastage.rebarPercent)
              : 5.0,
          brickMortarPercent:
            typeof candidate.userPreferences.wastage?.brickMortarPercent === 'number'
              ? Math.max(0, candidate.userPreferences.wastage.brickMortarPercent)
              : 5.0,
          earthworkShrinkagePercent:
            typeof candidate.userPreferences.wastage?.earthworkShrinkagePercent === 'number'
              ? Math.max(0, candidate.userPreferences.wastage.earthworkShrinkagePercent)
              : 10.0,
        },
        regionalLand: {
          kathaSquareFeet:
            typeof candidate.userPreferences.regionalLand?.kathaSquareFeet === 'number'
              ? candidate.userPreferences.regionalLand.kathaSquareFeet
              : 720,
          decimalSquareFeet:
            typeof candidate.userPreferences.regionalLand?.decimalSquareFeet === 'number'
              ? candidate.userPreferences.regionalLand.decimalSquareFeet
              : 435.6,
          bighaDecimals:
            typeof candidate.userPreferences.regionalLand?.bighaDecimals === 'number'
              ? candidate.userPreferences.regionalLand.bighaDecimals
              : 33,
          defaultLandUnit: candidate.userPreferences.regionalLand?.defaultLandUnit || 'decimal',
        },
        reportHeaderNote: candidate.userPreferences.reportHeaderNote ?? fallback.userPreferences?.reportHeaderNote,
        showEngineeringSignatureLine: candidate.userPreferences.showEngineeringSignatureLine ?? true,
        autoLogSnapshotsOnPrint: candidate.userPreferences.autoLogSnapshotsOnPrint ?? true,
        compactNumberFormatting: candidate.userPreferences.compactNumberFormatting ?? false,
      }
    : (fallback.userPreferences || createDefaultUserPreferences());

  const validPresets: EngineeringPreset[] =
    Array.isArray(candidate.presets) && candidate.presets.length > 0
      ? candidate.presets.map((p) => ({
          ...p,
          id: typeof p.id === 'string' && p.id.length >= 4 ? p.id : generateUUID(),
          name: typeof p.name === 'string' && p.name.trim().length > 0 ? p.name.trim() : 'Custom Preset',
          description: typeof p.description === 'string' ? p.description : '',
          category: p.category || 'concrete-mix',
          tags: Array.isArray(p.tags) ? p.tags : [],
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          payload: p.payload || {},
        }))
      : (fallback.presets || createDefaultEngineeringPresets());

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastMigratedAt: candidate.lastMigratedAt || fallback.lastMigratedAt,
    migratedFromVersion:
      typeof candidate.migratedFromVersion === 'number' ? candidate.migratedFromVersion : null,
    themePreference:
      candidate.themePreference === 'light' ||
      candidate.themePreference === 'dark' ||
      candidate.themePreference === 'system'
        ? candidate.themePreference
        : 'system',
    sidebarCollapsed: Boolean(candidate.sidebarCollapsed),
    splitRatioPercent:
      typeof candidate.splitRatioPercent === 'number'
        ? Math.min(65, Math.max(30, candidate.splitRatioPercent))
        : 44,
    activeWorkspaceId: activeIdExists ? candidate.activeWorkspaceId! : validWorkspaces[0].id,
    customUnits: Array.isArray(candidate.customUnits) ? candidate.customUnits : fallback.customUnits,
    commandRecentQueries: Array.isArray(candidate.commandRecentQueries)
      ? candidate.commandRecentQueries
      : fallback.commandRecentQueries,
    workspaces: validWorkspaces,
    calculationHistory: validHistory,
    userProfile: validUserProfile,
    userPreferences: validUserPreferences,
    presets: validPresets,
  };
}

export function loadPersistedState(): CivilLabSchemaV2 {
  try {
    const rawLegacyV1 = localStorage.getItem(LEGACY_V1_KEY);
    const rawV2 = localStorage.getItem(STORAGE_KEY);

    if (rawLegacyV1 && !rawV2) {
      const parsedV1 = JSON.parse(rawLegacyV1);
      const migrated = migrateToSchemaV2(parsedV1, 1);
      savePersistedState(migrated);
      localStorage.removeItem(LEGACY_V1_KEY);
      return migrated;
    }

    if (!rawV2) {
      const initial = createDefaultSchemaV2();
      savePersistedState(initial);
      return initial;
    }

    const parsed = JSON.parse(rawV2);
    const detectedVersion =
      typeof parsed?.schemaVersion === 'number'
        ? parsed.schemaVersion
        : typeof parsed?.version === 'number'
          ? parsed.version
          : 0;

    if (detectedVersion !== CURRENT_SCHEMA_VERSION) {
      const migrated = migrateToSchemaV2(parsed, detectedVersion || 1);
      savePersistedState(migrated);
      return migrated;
    }

    return validateAndNormalizeV2(parsed);
  } catch (err) {
    console.error('[PB CivilLab] Failed to parse localStorage state; falling back to clean schema v2:', err);
    const recovered = createDefaultSchemaV2();
    savePersistedState(recovered);
    return recovered;
  }
}

export function savePersistedState(state: CivilLabSchemaV2): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Asynchronously replicate to IndexedDB for resilient local-first durability
    persistToIndexedDB(state).catch((e) => {
      console.warn('[PB CivilLab] Asynchronous IndexedDB backup error:', e);
    });
  } catch (err) {
    console.error('[PB CivilLab] Failed to write state to localStorage:', err);
    // Even if localStorage quota exceeded, attempt persisting to IndexedDB
    persistToIndexedDB(state).catch((e) => {
      console.warn('[PB CivilLab] Emergency IndexedDB persist error:', e);
    });
  }
}

export function simulateV1MigrationSample(): CivilLabSchemaV2 {
  const sampleV1: LegacySchemaV1 = {
    schemaVersion: 1,
    theme: 'dark',
    projectName: 'Karnaphuli Tunnel Approach Slab (Migrated v1)',
    projectCode: 'KRN-V1-094',
    beamSpan: 15.0,
    beamLoad: 36.5,
    footingWidth: 3.8,
    soilCohesion: 30,
    history: [
      {
        title: 'Legacy v1 Approach Girder Check',
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        result: 'M_max = 1,026.56 kN·m (Pass)',
      },
    ],
  };

  localStorage.setItem(LEGACY_V1_KEY, JSON.stringify(sampleV1));
  localStorage.removeItem(STORAGE_KEY);
  return loadPersistedState();
}

export function clearAndResetStorage(mode: 'clean' | 'demo' = 'clean'): CivilLabSchemaV2 {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_V1_KEY);
  clearIndexedDB().catch((err) => {
    console.warn('[PB CivilLab] Failed clearing IndexedDB during reset:', err);
  });
  const fresh = mode === 'demo' ? createDemoSchemaV2() : createCleanSchemaV2();
  savePersistedState(fresh);
  return fresh;
}

export async function restoreStateFromIndexedDB(): Promise<CivilLabSchemaV2 | null> {
  const loaded = await loadFromIndexedDB();
  if (loaded) {
    const normalized = validateAndNormalizeV2(loaded);
    savePersistedState(normalized);
    return normalized;
  }
  return null;
}


export interface SingleWorkspaceExportEnvelope {
  schemaVersion: 2;
  exportType: 'single-workspace';
  brand?: string;
  tagline?: string;
  creator?: string;
  exportedAt: string;
  workspace: CivilWorkspace;
  history: CalculationRecord[];
}

export function exportProjectWorkspacePackage(
  workspace: CivilWorkspace,
  allHistory: CalculationRecord[]
): string {
  const wsHistory = allHistory.filter((rec) => rec.workspaceId === workspace.id);
  const envelope: SingleWorkspaceExportEnvelope = {
    schemaVersion: 2,
    exportType: 'single-workspace',
    brand: 'PB CivilLab',
    tagline: 'CALCULATE SMARTER. BUILD BETTER.',
    creator: 'PROKASH BISWAS',
    exportedAt: new Date().toISOString(),
    workspace,
    history: wsHistory,
  };
  return JSON.stringify(envelope, null, 2);
}

export function parseAndValidateProjectWorkspacePackage(
  jsonString: string
): { workspace: CivilWorkspace; history: CalculationRecord[] } | null {
  try {
    const raw = JSON.parse(jsonString);
    const fallback = createDefaultSchemaV2().workspaces[0];

    // Handle single-workspace envelope
    if (raw && typeof raw === 'object' && raw.workspace) {
      const candidateWs = raw.workspace as Partial<CivilWorkspace>;
      const normalizedWs: CivilWorkspace = {
        ...fallback,
        ...candidateWs,
        id: typeof candidateWs.id === 'string' && candidateWs.id.length >= 8 ? candidateWs.id : generateUUID(),
        name: candidateWs.name || 'Imported Civil Project',
        projectCode: candidateWs.projectCode || `IMP-${Math.floor(100 + Math.random() * 900)}`,
        siteLocation: candidateWs.siteLocation || 'Imported Jobsite',
        engineerOfRecord: candidateWs.engineerOfRecord || 'Consulting Engineer',
        currency: candidateWs.currency || fallback.currency || 'BDT',
        updatedAt: new Date().toISOString(),
        boq: {
          ...fallback.boq,
          ...(candidateWs.boq || {}),
          items: Array.isArray(candidateWs.boq?.items) ? candidateWs.boq.items : fallback.boq.items,
        },
        rateAnalysis: {
          ...fallback.rateAnalysis,
          ...(candidateWs.rateAnalysis || {}),
        },
      };

      const history: CalculationRecord[] = Array.isArray(raw.history)
        ? raw.history.map((h: Partial<CalculationRecord>) => ({
            id: typeof h.id === 'string' ? h.id : generateUUID(),
            workspaceId: normalizedWs.id,
            moduleId: h.moduleId || 'boq-estimator',
            timestamp: h.timestamp || new Date().toISOString(),
            title: h.title || 'Imported Calculation',
            notes: h.notes || '',
            status: h.status === 'warning' || h.status === 'critical' ? h.status : 'nominal',
            keyMetrics: Array.isArray(h.keyMetrics) ? h.keyMetrics : [],
            inputsSnapshot: h.inputsSnapshot || {},
          }))
        : [];

      return { workspace: normalizedWs, history };
    }

    // Handle if raw itself is a CivilWorkspace
    if (raw && typeof raw === 'object' && raw.name && (raw.boq || raw.beam || raw.converter)) {
      const candidateWs = raw as Partial<CivilWorkspace>;
      const normalizedWs: CivilWorkspace = {
        ...fallback,
        ...candidateWs,
        id: typeof candidateWs.id === 'string' && candidateWs.id.length >= 8 ? candidateWs.id : generateUUID(),
        name: candidateWs.name || 'Imported Civil Project',
        projectCode: candidateWs.projectCode || `IMP-${Math.floor(100 + Math.random() * 900)}`,
        siteLocation: candidateWs.siteLocation || 'Imported Jobsite',
        engineerOfRecord: candidateWs.engineerOfRecord || 'Consulting Engineer',
        currency: candidateWs.currency || fallback.currency || 'BDT',
        updatedAt: new Date().toISOString(),
        boq: {
          ...fallback.boq,
          ...(candidateWs.boq || {}),
          items: Array.isArray(candidateWs.boq?.items) ? candidateWs.boq.items : fallback.boq.items,
        },
        rateAnalysis: {
          ...fallback.rateAnalysis,
          ...(candidateWs.rateAnalysis || {}),
        },
      };
      return { workspace: normalizedWs, history: [] };
    }

    return null;
  } catch {
    return null;
  }
}

export interface PresetsExportEnvelope {
  schemaVersion: 2;
  exportType: 'civil-presets-package';
  brand: string;
  tagline: string;
  exportedAt: string;
  presets: EngineeringPreset[];
}

export function exportPresetsPackage(presets: EngineeringPreset[]): string {
  const envelope: PresetsExportEnvelope = {
    schemaVersion: 2,
    exportType: 'civil-presets-package',
    brand: 'PB CivilLab',
    tagline: 'CALCULATE SMARTER. BUILD BETTER.',
    exportedAt: new Date().toISOString(),
    presets,
  };
  return JSON.stringify(envelope, null, 2);
}

export function parseAndValidatePresetsPackage(jsonString: string): EngineeringPreset[] | null {
  try {
    const raw = JSON.parse(jsonString);
    let candidateList: unknown[] = [];
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.presets)) {
        candidateList = raw.presets;
      } else if (Array.isArray(raw)) {
        candidateList = raw;
      }
    }
    if (candidateList.length === 0) return null;
    return candidateList.map((p: any) => ({
      id: typeof p.id === 'string' && p.id.length >= 4 ? p.id : generateUUID(),
      name: typeof p.name === 'string' && p.name.trim().length > 0 ? p.name.trim() : 'Imported Preset',
      description: typeof p.description === 'string' ? p.description : '',
      category: p.category || 'concrete-mix',
      tags: Array.isArray(p.tags) ? p.tags : ['imported'],
      isBuiltIn: false,
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: typeof p.author === 'string' ? p.author : 'User Import',
      payload: p.payload || {},
    }));
  } catch {
    return null;
  }
}


