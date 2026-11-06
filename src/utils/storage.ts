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
  EngineeringModuleId,
  ArchitectureParameters,
} from '../types/civil';
import { persistToIndexedDB, clearIndexedDB, loadFromIndexedDB } from './indexedStorage';

export const STORAGE_KEY = 'pb_civillab_state_v3_clean';
export const LEGACY_V2_KEY = 'pb_civillab_state_v2';
export const LEGACY_V1_KEY = 'pb_civillab_state_v1';
export const CURRENT_SCHEMA_VERSION = 3 as const;

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
      itemNo: '200.01',
      description: 'Earth excavation in foundation pits in common soil (4 Footings)',
      category: 'earthwork',
      wbsSectionId: 'sec-200',
      numberOfMembers: 4,
      lengthM: 3.5,
      widthM: 3.5,
      heightM: 2.0,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 5.0,
      unitRate: 450,
      startMonth: 1,
      durationMonths: 2,
      curveDistribution: 'front-loaded' as any,
    },
    {
      id: 'takeoff-2',
      itemNo: '300.01',
      description: 'Single layer brick flat soling (BFS) with picked jhama bricks',
      category: 'substructure',
      wbsSectionId: 'sec-300',
      numberOfMembers: 4,
      lengthM: 3.5,
      widthM: 3.5,
      heightM: 0,
      deductionQty: 0,
      unit: 'm2',
      wastagePercent: 3.0,
      unitRate: 650,
      startMonth: 2,
      durationMonths: 2,
      curveDistribution: 'linear',
    },
    {
      id: 'takeoff-3',
      itemNo: '300.02',
      description: 'PCC (1:3:6) lean concrete bedding beneath footings (75mm thick)',
      category: 'substructure',
      wbsSectionId: 'sec-300',
      numberOfMembers: 4,
      lengthM: 3.5,
      widthM: 3.5,
      heightM: 0.075,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 3.0,
      unitRate: 8500,
      startMonth: 2,
      durationMonths: 2,
      curveDistribution: 'linear',
    },
    {
      id: 'takeoff-4',
      itemNo: '300.03',
      description: 'RCC (1:1.5:3) in isolated column footings including centering & shuttering',
      category: 'substructure',
      wbsSectionId: 'sec-300',
      numberOfMembers: 4,
      lengthM: 3.0,
      widthM: 3.0,
      heightM: 0.65,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 2.5,
      unitRate: 14200,
      startMonth: 3,
      durationMonths: 3,
      curveDistribution: 's-curve',
    },
    {
      id: 'takeoff-5',
      itemNo: '400.01',
      description: 'RCC (1:1.5:3) in pedestal columns from footing top to plinth level',
      category: 'superstructure',
      wbsSectionId: 'sec-400',
      numberOfMembers: 4,
      lengthM: 0.5,
      widthM: 0.5,
      heightM: 2.4,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 2.0,
      unitRate: 15800,
      startMonth: 4,
      durationMonths: 4,
      curveDistribution: 's-curve',
    },
    {
      id: 'takeoff-6',
      itemNo: '500.01',
      description: 'Deformed High Yield Rebar (Grade 60/500W) in substructure & columns',
      category: 'rebar',
      wbsSectionId: 'sec-500',
      numberOfMembers: 1,
      lengthM: 3450,
      widthM: 0,
      heightM: 0,
      deductionQty: 0,
      unit: 'kg',
      wastagePercent: 3.0,
      unitRate: 108,
      startMonth: 3,
      durationMonths: 5,
      curveDistribution: 's-curve',
    },
    {
      id: 'takeoff-7',
      itemNo: '600.01',
      description: 'First class brickwork (1:6 cement mortar) in plinth foundation walls',
      category: 'masonry',
      wbsSectionId: 'sec-600',
      numberOfMembers: 2,
      lengthM: 18.0,
      widthM: 0.25,
      heightM: 1.2,
      deductionQty: 0,
      unit: 'm3',
      wastagePercent: 4.0,
      unitRate: 9800,
      startMonth: 6,
      durationMonths: 3,
      curveDistribution: 's-curve',
    },
  ];
}

export function createDefaultArchitectureParameters(): ArchitectureParameters {
  return {
    farMgc: {
      landUnit: 'katha',
      landAreaValue: 5.0,
      customKathaSqFt: 720,
      occupancy: 'residential',
      roadWidthM: 9.14,
      frontageM: 14.5,
      plotDepthM: 23.0,
      isAutoDimension: true,
      enableOverride: false,
      overrideFar: 3.5,
      overrideMgc: 60,
      overrideSetbacks: { front: 1.5, rear: 2.0, side1: 1.25, side2: 1.25 },
    },
    staircase: {
      stairType: 'dog-legged',
      floorHeightMm: 3000,
      stairwellLengthMm: 4500,
      stairwellWidthMm: 2400,
      preferredRiserMm: 150,
      preferredTreadMm: 275,
      waistSlabMm: 150,
      slabThicknessMm: 150,
      landingWidthMm: 1200,
      nosingMm: 25,
      liveLoadKpa: 3.0,
      finishesLoadKpa: 1.0,
    },
    waterTank: {
      calcMode: 'building',
      numFloors: 6,
      unitsPerFloor: 2,
      personsPerUnit: 5,
      directOccupants: 50,
      floatingPopulation: 5,
      lpcd: 135,
      storageDays: 1.0,
      fireReserveL: 10000,
      ugwrSharePercent: 65,
      ugwrWaterDepthM: 2.0,
      ugwrLwRatio: 1.5,
      ohtWaterDepthM: 1.6,
      ohtLwRatio: 1.3,
      pumpFillHours: 2.0,
      totalHeadM: 28,
    },
    septicTank: {
      septicUsers: 35,
      sewageRateLpcd: 90,
      detentionHours: 24,
      desludgingYears: 2.0,
      septicDepthM: 1.6,
      septicLwRatio: 2.5,
      soilPercolationRate: 30,
      soakPitDiaM: 1.8,
    },
  };
}

export function createDefaultWorkspaces(): CivilWorkspace[] {
  const now = new Date().toISOString();
  return [
    {
      id: generateUUID(),
      name: 'Primary Civil Engineering Project',
      projectCode: 'CIV-2026-001',
      siteLocation: 'Main Construction Sector',
      engineerOfRecord: 'Project Engineer, PE',
      createdAt: now,
      updatedAt: now,
      activeModule: 'boq-estimator',
      governingCode: 'BNBC-2020',
      currency: 'BDT',
      boq: {
        currency: 'BDT',
        contingencyPercent: 0,
        contractorOverheadPercent: 0,
        vatTaxPercent: 0,
        items: [],
      },
      rateAnalysis: {
        workType: 'rcc-1-1.5-3',
        basisVolumeM3: 0,
        currency: 'BDT',
        cementPricePerBag: 0,
        sandPricePerM3: 0,
        stoneChipsPricePerM3: 0,
        rebarPricePerKg: 0,
        rebarAllowanceKgPerM3: 0,
        admixturePricePerKg: 0,
        admixtureDoseKgPerM3: 0,
        brickPricePer1000: 0,
        masonDailyWage: 0,
        masonDaysRequired: 0,
        laborerDailyWage: 0,
        laborerDaysRequired: 0,
        barBenderDailyWage: 0,
        barBenderDaysRequired: 0,
        mixerHirePerM3: 0,
        vibratorHirePerM3: 0,
        shutteringScaffoldingPerM3: 0,
        waterElectricityPercent: 0,
        contractorProfitPercent: 0,
      },
      converter: {
        category: 'volume',
        fromUnit: 'm3',
        toUnit: 'cft',
        inputValue: 0,
        feetInchRawString: '',
      },
      beam: {
        spanLengthM: 0,
        uniformLoadKnPerM: 0,
        pointLoadKn: 0,
        pointLoadPositionM: 0,
        elasticModulusGpa: 200,
        momentOfInertiaCm4: 0,
        supportCondition: 'simply-supported',
        allowableStressMpa: 250,
        sectionDepthMm: 0,
        seismicZone: 'Zone 2 (Z=0.20)',
        seismicImportanceI: 1.0,
        responseReductionR: 5.0,
        buildingSeismicWeightKn: 5000,
        siteSoilClass: 'SC',
        windDistrict: 'Dhaka',
        basicWindSpeedMs: 65.7,
        buildingHeightM: 20,
        tributaryWidthM: 5,
        windExposureCategory: 'B',
      },
      bearing: {
        footingShape: 'square',
        footingWidthM: 0,
        embedmentDepthM: 0,
        soilCohesionKpa: 0,
        frictionAngleDeg: 0,
        unitWeightKnPerM3: 0,
        waterTableDepthM: 0,
        factorOfSafety: 3.0,
        appliedColumnLoadKn: 0,
        footingThicknessMm: 450,
        colWidthMm: 300,
        colDepthMm: 300,
        fckMpa: 21,
        fyMpa: 420,
        clearCoverMm: 75,
      },
      concrete: {
        targetStrengthMpa: 0,
        waterCementRatio: 0,
        slumpMm: 0,
        maxAggregateSizeMm: 20,
        cementSpecificGravity: 3.15,
        fineAggSpecificGravity: 2.65,
        coarseAggSpecificGravity: 2.7,
        airEntrainmentPercent: 0,
        batchVolumeM3: 0,
      },
      channel: {
        bottomWidthM: 0,
        sideSlopeZ: 0,
        flowDepthM: 0,
        bedSlope: 0,
        manningN: 0.015,
        freeboardRequirementM: 0,
      },
      concreteMaterials: {
        code: 'BNBC-2020',
        wetVolumeM3: 0,
        ratioCement: 1,
        ratioSand: 0,
        ratioAggregate: 0,
        waterCementRatio: 0.45,
        cementBagWeightKg: 50,
        cementBulkDensityKgPerM3: 1440,
        sandBulkDensityKgPerM3: 1600,
        aggregateBulkDensityKgPerM3: 1520,
        customDryFactor: 1.54,
        wastagePercent: 0,
      },
      rebarBbs: {
        elementType: 'slab',
        clearCoverMm: 0,
        rebarDensityKgPerM3: 7850,
        hookAngle: '90',
        slabLengthM: 0,
        slabWidthM: 0,
        slabThicknessMm: 0,
        mainBarDiaMm: 0,
        mainBarSpacingMm: 0,
        distBarDiaMm: 0,
        distBarSpacingMm: 0,
        colLengthMm: 0,
        colWidthMm: 0,
        colHeightM: 0,
        colMainBarDiaMm: 0,
        colMainBarCount: 0,
        tieBarDiaMm: 0,
        tieSpacingMm: 0,
        circColDiaMm: 0,
        circColHeightM: 0,
        circMainBarDiaMm: 0,
        circMainBarCount: 0,
        spiralTieDiaMm: 0,
        spiralPitchMm: 0,
        footingLengthM: 0,
        footingWidthM: 0,
        footingDepthMm: 0,
        footingBarDiaMm: 0,
        footingBarSpacingMm: 0,
        stairGoingM: 0,
        stairTotalRiseM: 0,
        waistSlabThicknessMm: 0,
        riserMm: 0,
        treadMm: 0,
        landingLengthM: 0,
        stairMainBarDiaMm: 0,
        stairMainBarSpacingMm: 0,
        stairDistBarDiaMm: 0,
        stairDistBarSpacingMm: 0,
        // Lapping & 12m Commercial Bar Stock
        lappingFactorD: 50,
        commercialBarStockLengthM: 12.0,
        // Lintel & Chajja defaults
        lintelLengthM: 2.1,
        lintelWidthMm: 250,
        lintelDepthMm: 150,
        lintelMainBarDiaMm: 12,
        lintelTopBarCount: 2,
        lintelBotBarCount: 2,
        lintelStirrupDiaMm: 8,
        lintelStirrupSpacingMm: 150,
        chajjaProjectionM: 0.6,
        chajjaRootThicknessMm: 100,
        chajjaTipThicknessMm: 75,
        chajjaMainBarDiaMm: 10,
        chajjaMainBarSpacingMm: 150,
        chajjaDistBarDiaMm: 8,
        chajjaDistBarSpacingMm: 200,
        // Bored Pile Cage defaults
        pileDiaMm: 500,
        pileLengthM: 18.0,
        pileMainBarDiaMm: 16,
        pileMainBarCount: 7,
        pileSpiralDiaMm: 8,
        pileSpiralPitchMm: 150,
        pileStiffenerBarDiaMm: 12,
        pileStiffenerSpacingM: 2.0,
        pileCutoffEmbedmentM: 0.75,
      },
      masonry: {
        wallLengthM: 0,
        wallHeightM: 0,
        wallThicknessM: 0,
        brickLengthMm: 240,
        brickWidthMm: 115,
        brickHeightMm: 70,
        mortarJointMm: 10,
        mortarRatioCement: 1,
        mortarRatioSand: 0,
        brickWastagePercent: 0,
        openings: [],
        plasterThicknessMm: 0,
        plasterSides: 0,
        plasterRatioCement: 1,
        plasterRatioSand: 0,
        floorLengthM: 0,
        floorWidthM: 0,
        tileLengthMm: 0,
        tileWidthMm: 0,
        tilesPerBox: 0,
        tileWastagePercent: 0,
        puttyCoats: 2,
        puttyCoverageKgPerM2: 0.90,
        primerCoverageM2PerL: 11.0,
        paintCoats: 2,
        paintCoverageM2PerL: 6.5,
        paintWastagePercent: 5,
        grillWeightKgPerSft: 1.40,
        includeGrillSchedule: true,
        includeThaiSchedule: true,
      },
      earthwork: {
        calculationType: 'pit-excavation',
        soilType: 'common-earth',
        pitTopLengthM: 0,
        pitTopWidthM: 0,
        pitDepthM: 0,
        pitSideSlopeH: 0,
        trenchLengthM: 0,
        trenchBottomWidthM: 0,
        trenchDepthM: 0,
        trenchSideSlopeH: 0,
        roadLengthM: 0,
        formationWidthM: 0,
        sideSlopeS: 0,
        depthStation1M: 0,
        depthStation2M: 0,
        depthStation3M: 0,
        customSwellPercent: 0,
        customShrinkagePercent: 0,
      },
      continuousBeam: {
        spanCount: 2,
        spans: [
          {
            id: 'span-1',
            spanIndex: 0,
            lengthM: 0,
            momentOfInertiaCm4: 0,
            elasticModulusGpa: 200,
            udlKnPerM: 0,
            pointLoadKn: 0,
            pointLoadPositionM: 0,
          },
          {
            id: 'span-2',
            spanIndex: 1,
            lengthM: 0,
            momentOfInertiaCm4: 0,
            elasticModulusGpa: 200,
            udlKnPerM: 0,
            pointLoadKn: 0,
            pointLoadPositionM: 0,
          },
        ],
        leftSupport: 'pin',
        rightSupport: 'pin',
        allowableStressMpa: 250,
        sectionDepthMm: 0,
      },
      pile: {
        pileType: 'bored-cast-in-situ',
        diameterM: 0,
        lengthM: 0,
        groundwaterDepthM: 0,
        appliedLoadKn: 0,
        factorOfSafety: 2.5,
        layers: [],
        tipBearingCohesionKpa: 0,
        tipBearingFrictionDeg: 0,
        tipBearingUnitWeightKnPerM3: 0,
      },
      pipe: {
        serviceType: 'pressure',
        pipeMaterial: 'pvc-hdpe',
        hazenWilliamsC: 150,
        internalDiameterMm: 0,
        lengthM: 0,
        flowRateLps: 0,
        inletElevationM: 0,
        outletElevationM: 0,
        inletPressureKpa: 0,
        minorLossCoefficientK: 0,
        waterTempC: 20,
        tubewellDepthM: 60,
        staticWaterLevelM: 25,
        drawdownM: 6,
        deliveryHeadM: 20,
        pumpEfficiencyPercent: 70,
        motorEfficiencyPercent: 85,
        upvcClass: 'Class C (9 bar)',
        fixtureWaterClosets: 6,
        fixtureWashBasins: 6,
        fixtureShowers: 4,
        fixtureKitchenSinks: 2,
        fixtureFloorDrains: 4,
        fixtureFloorTraps: 4,
        fixtureUrinals: 0,
      },
      surveying: {
        method: 'height-of-instrument',
        benchmarkRL: 0,
        stations: [],
        degrees: 0,
        minutes: 0,
        seconds: 0,
        decimalDegreeOutput: 0,
        inputDecimalDegrees: 0,
        station1Name: '',
        easting1M: 0,
        northing1M: 0,
        station2Name: '',
        easting2M: 0,
        northing2M: 0,
      },
      unitPreferences: {
        systemPreset: 'metric',
        fieldUnits: {},
        outputUnits: {},
      },
      architecture: createDefaultArchitectureParameters(),
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
      engineerOfRecord: 'Project Engineer, PE',
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
    fullName: '',
    designation: 'Project Engineer, PE',
    organization: 'Consulting Firm',
    role: 'structural-engineer',
    licenseNumber: '',
    email: '',
    phone: '',
    initials: '',
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
    {
      id: 'preset-boq-substructure-standard',
      name: 'Standard Substructure Takeoff (PWD / BNBC)',
      description: 'Comprehensive baseline BOQ for footings, lean bedding, pedestal columns, rebar, and brickwork.',
      category: 'complete-workspace',
      tags: ['BOQ', 'Takeoff', 'Substructure', 'Standard'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'PB CivilLab Standards',
      payload: {
        targetModule: 'boq-estimator',
        boq: {
          currency: 'BDT',
          contingencyPercent: 3.0,
          contractorOverheadPercent: 10.0,
          vatTaxPercent: 7.5,
          items: createSampleBOQItems(),
        },
      },
    },
    {
      id: 'preset-rebar-two-way-slab',
      name: 'Two-Way RCC Slab Schedule (6.0m × 4.5m × 150mm)',
      description: 'BNBC 2020 two-way suspended floor slab with Ø12mm main rebar @ 150mm c/c and Ø10mm distribution @ 175mm c/c.',
      category: 'complete-workspace',
      tags: ['Rebar', 'BBS', 'Slab', 'BNBC-2020'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Structural Standards',
      payload: {
        targetModule: 'rebar-bbs',
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
        },
      },
    },
    {
      id: 'preset-masonry-standard-wall',
      name: 'Standard 10" Exterior Wall with Openings & Plaster',
      description: '10" brick masonry wall (1:5 mortar) with D1 entry door, W1 windows, and 12mm dual-sided cement plaster (1:4).',
      category: 'complete-workspace',
      tags: ['Masonry', 'Plaster', 'Brickwork', 'Tiles'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Finishes Standards',
      payload: {
        targetModule: 'masonry-finishes',
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
      },
    },
    {
      id: 'preset-earthwork-foundation-pit',
      name: 'Deep Foundation Pit Excavation (14m × 10m × 2.8m)',
      description: 'Prismoidal pit excavation in common earth with 0.5:1 safe bank slope, 25% swell, and 80% shrinkage.',
      category: 'earthwork-hydraulics',
      tags: ['Earthwork', 'Excavation', 'Foundations'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Geotech Standards',
      payload: {
        targetModule: 'earthwork-alignment',
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
      },
    },
    {
      id: 'preset-continuous-beam-3span',
      name: '3-Span Continuous Bridge Girder (6m + 7.5m + 5.5m)',
      description: 'Multi-span indeterminate girder with combined uniform dead/live load and point axle loads under 3-moment analysis.',
      category: 'structural-beam',
      tags: ['Continuous Beam', '3-Moment', 'Bridge Girder', 'Structural'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Structural Standards',
      payload: {
        targetModule: 'continuous-beam',
        continuousBeam: {
          spanCount: 3,
          spans: [
            {
              id: 'span-1',
              spanIndex: 0,
              lengthM: 6.0,
              momentOfInertiaCm4: 120000,
              elasticModulusGpa: 200,
              udlKnPerM: 25.0,
              pointLoadKn: 40.0,
              pointLoadPositionM: 3.0,
            },
            {
              id: 'span-2',
              spanIndex: 1,
              lengthM: 7.5,
              momentOfInertiaCm4: 120000,
              elasticModulusGpa: 200,
              udlKnPerM: 30.0,
              pointLoadKn: 60.0,
              pointLoadPositionM: 3.75,
            },
            {
              id: 'span-3',
              spanIndex: 2,
              lengthM: 5.5,
              momentOfInertiaCm4: 120000,
              elasticModulusGpa: 200,
              udlKnPerM: 20.0,
              pointLoadKn: 30.0,
              pointLoadPositionM: 2.75,
            },
          ],
          leftSupport: 'pin',
          rightSupport: 'pin',
          allowableStressMpa: 250,
          sectionDepthMm: 600,
        },
      },
    },
    {
      id: 'preset-pile-bored-deep',
      name: '600mm × 22m Deep Bored Cast-in-Situ Pile',
      description: 'BNBC 2020 bored pile through soft alluvial clay and silty sand terminating in dense bearing gravel layer.',
      category: 'bearing-soil',
      tags: ['Piles', 'Deep Foundations', 'Bored Pile', 'BNBC'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Geotech Standards',
      payload: {
        targetModule: 'pile-capacity',
        pile: {
          pileType: 'bored-cast-in-situ',
          diameterM: 0.6,
          lengthM: 22.0,
          groundwaterDepthM: 3.0,
          appliedLoadKn: 1650,
          factorOfSafety: 2.5,
          layers: [
            {
              id: 'layer-1',
              name: 'Soft Silty Clay (Overburden)',
              thicknessM: 6.0,
              soilType: 'clay',
              cohesionKpa: 28,
              frictionAngleDeg: 0,
              unitWeightKnPerM3: 17.5,
            },
            {
              id: 'layer-2',
              name: 'Medium Dense Silty Sand',
              thicknessM: 8.0,
              soilType: 'sand',
              cohesionKpa: 0,
              frictionAngleDeg: 30,
              unitWeightKnPerM3: 18.5,
            },
            {
              id: 'layer-3',
              name: 'Dense Bearing Sand & Gravel',
              thicknessM: 10.0,
              soilType: 'sand',
              cohesionKpa: 0,
              frictionAngleDeg: 36,
              unitWeightKnPerM3: 20.0,
            },
          ],
          tipBearingCohesionKpa: 0,
          tipBearingFrictionDeg: 36,
          tipBearingUnitWeightKnPerM3: 20.0,
        },
      },
    },
    {
      id: 'preset-pipe-pvc-gravity',
      name: '250mm High-Capacity PVC Storm Drainage Main',
      description: 'Hazen-Williams C=150 gravity stormwater discharge line (45 L/s, 180m length, 7m head drop).',
      category: 'earthwork-hydraulics',
      tags: ['Hydraulics', 'Pipes', 'Hazen-Williams', 'Water'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Hydraulics Standards',
      payload: {
        targetModule: 'pipe-hydraulics',
        pipe: {
          pipeMaterial: 'pvc-hdpe',
          hazenWilliamsC: 150,
          internalDiameterMm: 250,
          lengthM: 180,
          flowRateLps: 45,
          inletElevationM: 25.0,
          outletElevationM: 18.0,
          inletPressureKpa: 300,
          minorLossCoefficientK: 2.0,
          waterTempC: 20,
        },
      },
    },
    {
      id: 'preset-surveying-loop-standard',
      name: 'Bench Mark Fly Leveling Loop (BM RL 100.000m)',
      description: '4-station height-of-instrument leveling run with back-sight, intermediate, and foresight checks.',
      category: 'complete-workspace',
      tags: ['Surveying', 'Leveling', 'Benchmark', 'HI'],
      isBuiltIn: true,
      createdAt: now,
      updatedAt: now,
      author: 'Surveying Standards',
      payload: {
        targetModule: 'surveying-suite',
        surveying: {
          method: 'height-of-instrument',
          benchmarkRL: 100.0,
          stations: [
            { id: 'stn-bm', stationName: 'BM-01', backsight: 1.455, reducedLevel: 100.0, remarks: 'Permanent Bench Mark' },
            { id: 'stn-1', stationName: 'CP-1', intermediateSight: 1.82, reducedLevel: 99.635, remarks: 'Culvert Invert' },
            { id: 'stn-2', stationName: 'CP-2', foresight: 2.14, reducedLevel: 99.315, remarks: 'Formation Level' },
          ],
          degrees: 45,
          minutes: 30,
          seconds: 15,
          decimalDegreeOutput: 45.50417,
          inputDecimalDegrees: 45.50417,
          station1Name: 'Stn A',
          easting1M: 1000,
          northing1M: 2000,
          station2Name: 'Stn B',
          easting2M: 1350,
          northing2M: 2450,
        },
      },
    },
  ];
}

export function getOfficialModulePreset(moduleId: EngineeringModuleId): EngineeringPreset | null {
  const allPresets = createDefaultEngineeringPresets();
  const match = allPresets.find((p) => p.payload.targetModule === moduleId);
  if (match) return match;

  // Category fallback matching
  if (moduleId === 'concrete-materials') {
    return allPresets.find((p) => p.id === 'preset-concrete-m20-nominal') || null;
  }
  if (moduleId === 'concrete-mix') {
    return allPresets.find((p) => p.id === 'preset-concrete-m25-structural') || null;
  }
  if (moduleId === 'rate-analysis') {
    return allPresets.find((p) => p.id === 'preset-rates-pwd-2024') || null;
  }
  if (moduleId === 'beam-analysis') {
    return allPresets.find((p) => p.id === 'preset-beam-w24-transfer') || null;
  }
  if (moduleId === 'bearing-capacity') {
    return allPresets.find((p) => p.id === 'preset-soil-deltaic-clay') || null;
  }
  if (moduleId === 'open-channel') {
    return allPresets.find((p) => p.id === 'preset-channel-lined-drain') || null;
  }
  return null;
}

export function getZeroBaselineForModule(moduleId: EngineeringModuleId): Partial<CivilWorkspace> {
  const zeroWs = createDefaultWorkspaces()[0];
  switch (moduleId) {
    case 'boq-estimator':
      return { boq: zeroWs.boq };
    case 'rate-analysis':
      return { rateAnalysis: zeroWs.rateAnalysis };
    case 'unit-converter':
      return { converter: zeroWs.converter };
    case 'beam-analysis':
      return { beam: zeroWs.beam };
    case 'bearing-capacity':
      return { bearing: zeroWs.bearing };
    case 'concrete-mix':
      return { concrete: zeroWs.concrete };
    case 'open-channel':
      return { channel: zeroWs.channel };
    case 'concrete-materials':
      return { concreteMaterials: zeroWs.concreteMaterials };
    case 'rebar-bbs':
      return { rebarBbs: zeroWs.rebarBbs };
    case 'masonry-finishes':
      return { masonry: zeroWs.masonry };
    case 'earthwork-alignment':
      return { earthwork: zeroWs.earthwork };
    case 'continuous-beam':
      return { continuousBeam: zeroWs.continuousBeam };
    case 'pile-capacity':
      return { pile: zeroWs.pile };
    case 'pipe-hydraulics':
      return { pipe: zeroWs.pipe };
    case 'surveying-suite':
      return { surveying: zeroWs.surveying };
    default:
      return {};
  }
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
    commandRecentQueries: [],
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
          architecture: ws.architecture
            ? {
                farMgc: { ...(fallback.workspaces[0].architecture?.farMgc || createDefaultArchitectureParameters().farMgc), ...(ws.architecture.farMgc || {}) },
                staircase: { ...(fallback.workspaces[0].architecture?.staircase || createDefaultArchitectureParameters().staircase), ...(ws.architecture.staircase || {}) },
                waterTank: { ...(fallback.workspaces[0].architecture?.waterTank || createDefaultArchitectureParameters().waterTank), ...(ws.architecture.waterTank || {}) },
                septicTank: { ...(fallback.workspaces[0].architecture?.septicTank || createDefaultArchitectureParameters().septicTank), ...(ws.architecture.septicTank || {}) },
              }
            : fallback.workspaces[0].architecture || createDefaultArchitectureParameters(),
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
          typeof candidate.userProfile.fullName === 'string'
            ? candidate.userProfile.fullName.trim()
            : (fallback.userProfile?.fullName || ''),
        designation:
          typeof candidate.userProfile.designation === 'string' &&
          candidate.userProfile.designation.trim().length > 0
            ? candidate.userProfile.designation.trim()
            : fallback.userProfile?.designation || 'Project Engineer, PE',
        organization:
          typeof candidate.userProfile.organization === 'string' &&
          candidate.userProfile.organization.trim().length > 0
            ? candidate.userProfile.organization.trim()
            : fallback.userProfile?.organization || 'Consulting Firm',
        role: candidate.userProfile.role || fallback.userProfile?.role || 'structural-engineer',
        licenseNumber:
          typeof candidate.userProfile.licenseNumber === 'string'
            ? candidate.userProfile.licenseNumber.trim()
            : (fallback.userProfile?.licenseNumber || ''),
        email:
          typeof candidate.userProfile.email === 'string'
            ? candidate.userProfile.email.trim()
            : (fallback.userProfile?.email || ''),
        phone:
          typeof candidate.userProfile.phone === 'string'
            ? candidate.userProfile.phone.trim()
            : (fallback.userProfile?.phone || ''),
        initials:
          typeof candidate.userProfile.initials === 'string'
            ? candidate.userProfile.initials.trim().toUpperCase()
            : (fallback.userProfile?.initials || ''),
        bio:
          typeof candidate.userProfile.bio === 'string' &&
          candidate.userProfile.bio.trim().length > 0
            ? candidate.userProfile.bio.trim()
            : fallback.userProfile?.bio ||
              'Civil & Structural Design Engineer specializing in reinforced concrete, geotechnical foundations, and infrastructure project cost engineering.',
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

export function purgeLegacyStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const hasLegacyV1 = localStorage.getItem(LEGACY_V1_KEY);
    const hasLegacyV2 = localStorage.getItem(LEGACY_V2_KEY);
    const hasV3 = localStorage.getItem(STORAGE_KEY);

    if (hasLegacyV1 !== null || hasLegacyV2 !== null || !hasV3) {
      console.info('[PB CivilLab] Purging legacy storage keys (pb_civillab_state_v1, pb_civillab_state_v2) and stale IndexedDB snapshots.');
      localStorage.removeItem(LEGACY_V1_KEY);
      localStorage.removeItem(LEGACY_V2_KEY);
      clearIndexedDB().catch((err) => {
        console.warn('[PB CivilLab] Error clearing stale IndexedDB snapshot on initial boot:', err);
      });
    }
  } catch (err) {
    console.warn('[PB CivilLab] Purge error:', err);
  }
}

export function loadPersistedState(): CivilLabSchemaV2 {
  // Purge legacy storage and stale IndexedDB on initial boot
  purgeLegacyStorage();

  try {
    const rawV3 = localStorage.getItem(STORAGE_KEY);

    if (!rawV3) {
      const initial = createDefaultSchemaV2();
      savePersistedState(initial);
      return initial;
    }

    const parsed = JSON.parse(rawV3);
    const detectedVersion =
      typeof parsed?.schemaVersion === 'number'
        ? parsed.schemaVersion
        : typeof parsed?.version === 'number'
          ? parsed.version
          : 0;

    if (detectedVersion !== CURRENT_SCHEMA_VERSION) {
      // Version mismatch: wipe previously entered user logs and reset to clean baseline while preserving system settings
      const clean = createDefaultSchemaV2();
      if (parsed.themePreference) clean.themePreference = parsed.themePreference;
      if (parsed.userProfile) clean.userProfile = { ...clean.userProfile, ...parsed.userProfile };
      if (parsed.userPreferences) clean.userPreferences = { ...clean.userPreferences, ...parsed.userPreferences };
      savePersistedState(clean);
      return clean;
    }

    return validateAndNormalizeV2(parsed);
  } catch (err) {
    console.error('[PB CivilLab] Failed to parse localStorage state; falling back to clean schema v3:', err);
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
  localStorage.removeItem(LEGACY_V2_KEY);
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


