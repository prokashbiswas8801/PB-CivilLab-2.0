export type ThemePreference = 'light' | 'dark' | 'system';

export type CalculationStatus = 'valid' | 'warning' | 'invalid';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export type EngineeringModuleId =
  | 'boq-estimator'
  | 'rate-analysis'
  | 'unit-converter'
  | 'concrete-materials'
  | 'rebar-bbs'
  | 'masonry-finishes'
  | 'earthwork-alignment'
  | 'beam-analysis'
  | 'bearing-capacity'
  | 'concrete-mix'
  | 'open-channel'
  | 'continuous-beam'
  | 'frame-truss-2d'
  | 'section-analyzer'
  | 'rc-column-design'
  | 'strut-and-tie'
  | 'pile-capacity'
  | 'pipe-hydraulics'
  | 'surveying-suite'
  | 'store-inventory'
  | 'material-requisition'
  | 'schedule-roster'
  | 'labor-attendance'
  | 'field-notebook'
  | 'contractor-bills'
  | 'petty-cash'
  | 'cube-tests'
  | 'daily-progress-report'
  | 'office-docs';

export type BuildingCode = 'BNBC-2020' | 'ACI-318' | 'IS-456';

export type SupportCondition = 'simply-supported' | 'cantilever' | 'fixed-ends' | 'overhanging';

/* Currency Types & Metadata */
export type CurrencyCode =
  | 'BDT'
  | 'USD'
  | 'INR'
  | 'EUR'
  | 'GBP'
  | 'AED'
  | 'SAR'
  | 'CAD'
  | 'AUD'
  | 'SGD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka (BDT ৳)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD $)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR ₹)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR €)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP £)' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham (AED د.إ)' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal (SAR ﷼)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD $)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD $)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD $)' },
];

/* Custom Engineering Unit Definition */
export interface CustomUnitDefinition {
  id: string;
  name: string;
  symbol: string;
  category: UnitCategoryKey;
  // Factor relative to the base SI unit in that category (e.g. meter, m2, m3, kg, Pa, N)
  toBaseFactor: number;
  description: string;
  isRegional?: boolean;
}

export type UnitCategoryKey =
  | 'length'
  | 'area'
  | 'volume'
  | 'mass'
  | 'pressure'
  | 'force'
  | 'distributed_load'
  | 'density'
  | 'moment'
  | 'slope'
  | 'velocity'
  | 'flow_rate'
  | 'section_properties'
  | 'viscosity'
  | 'temperature'
  | 'energy'
  | 'power'
  | 'time_frequency'
  | 'digital_storage'
  | 'fuel_economy'
  | 'cad_typography';

export type UnitSystemPreset = 'metric' | 'imperial' | 'regional' | 'custom' | 'mixed';

export interface WorkspaceUnitPreferences {
  systemPreset: UnitSystemPreset;
  // Field-level input unit selections, e.g. "beam.spanLength": "ft", "beam.deadLoad": "plf"
  fieldUnits: Record<string, string>;
  // Output display unit preferences, e.g. "beam.moment": "kip.ft", "bearing.capacity": "tsf"
  outputUnits: Record<string, string>;
}

/* Unit Converter Parameters */
export interface UnitConverterParameters {
  category: UnitCategoryKey;
  fromUnit: string;
  toUnit: string;
  inputValue: number;
  feetInchRawString: string;
  regionalLandPreset?: 'standard' | 'rajshahi' | 'chattogram';
}

/* -------------------------------------------------------------
   MODULE: QUANTITY TAKEOFF & BOQ ESTIMATOR
------------------------------------------------------------- */
export type TakeoffUnit =
  | 'm3'
  | 'm2'
  | 'm'
  | 'kg'
  | 'ton'
  | 'cft'
  | 'sft'
  | 'rft'
  | 'bags'
  | 'nos'
  | 'lump-sum';

export type TakeoffCategory =
  | 'earthwork'
  | 'substructure'
  | 'superstructure'
  | 'rebar'
  | 'masonry'
  | 'finishing'
  | 'plumbing'
  | 'electrical'
  | 'misc';

export interface WBSSection {
  id: string; // e.g. 'sec-100'
  code: string; // e.g. '100'
  title: string; // e.g. 'Section 100: General & Site Preliminaries'
  category: TakeoffCategory;
  description?: string;
}

export interface VendorBidQuote {
  vendorName: string;
  unitRate: number;
  notes?: string;
}

export interface BidTabulationItem {
  id: string;
  itemId?: string;
  itemDescription: string;
  category: TakeoffCategory;
  unit: TakeoffUnit;
  quantity: number;
  engineersEstimateRate: number;
  vendor1: VendorBidQuote;
  vendor2: VendorBidQuote;
  vendor3: VendorBidQuote;
}

export interface BidTabulationData {
  vendor1Name: string;
  vendor2Name: string;
  vendor3Name: string;
  items: BidTabulationItem[];
}

export interface TakeoffLineItem {
  id: string;
  itemNo: string;
  description: string;
  category: TakeoffCategory;
  wbsSectionId?: string; // e.g. 'sec-100', 'sec-200'
  numberOfMembers: number; // Multiplier / Nos (>= 1)
  lengthM: number;
  widthM: number;
  heightM: number;
  deductionQty: number; // Volume/Area to deduct (e.g. doors/windows)
  unit: TakeoffUnit;
  wastagePercent: number; // e.g. 3-5%
  unitRate: number; // price per unit in workspace currency
  // Scheduling & Cash Flow S-Curve Linkage:
  startMonth?: number; // 1-indexed project month
  durationMonths?: number; // Month duration
  curveDistribution?: 's-curve' | 'linear' | 'early-peak' | 'late-peak';
  vendorSource?: string;
}

export interface BOQParameters {
  currency: CurrencyCode;
  contingencyPercent: number; // e.g. 3%
  contractorOverheadPercent: number; // CP&OH e.g. 10%
  vatTaxPercent: number; // e.g. 7.5% or 15% (Bangladeshi statutory VAT)
  aitTaxPercent?: number; // Advance Income Tax (AIT e.g. 5.0% or 7.0% per NBR/PWD rules)
  retentionMoneyPercent?: number; // Retention money withheld e.g. 5% to 10% (Security deposit)
  items: TakeoffLineItem[];
  // Advanced QS & Tender Management:
  rateLibraryId?: 'pwd-2024' | 'pwd-2025' | 'lged-2024' | 'commercial' | 'custom';
  regionalDistrictId?: string; // e.g. 'dhaka', 'chittagong', 'sylhet', etc.
  regionalMultiplier?: number; // e.g. 1.00, 1.05
  projectDurationMonths?: number; // Total construction duration (e.g. 12 months)
  retainagePercent?: number; // Retention money withheld e.g. 5% or 10% (Security deposit)
  mobilizationAdvancePercent?: number; // Mobilization advance paid upfront e.g. 10%
  mobilizationRecoveryPercent?: number; // Monthly recovery rate e.g. 10% or 20%
  bidTabulation?: BidTabulationData;
}

/* -------------------------------------------------------------
   MODULE: GRANULAR RATE ANALYSIS (1 m³ RCC & CIVIL TRADES)
------------------------------------------------------------- */
export type RateAnalysisWorkType =
  | 'rcc-1-1.5-3'
  | 'rcc-1-2-4'
  | 'pcc-1-3-6'
  | 'brickwork-1-6'
  | 'plaster-1-4'
  | 'rebar-fabrication';

export interface RateAnalysisParameters {
  workType: RateAnalysisWorkType;
  basisVolumeM3: number; // standard 1.0 m3
  currency: CurrencyCode;
  // Materials:
  cementPricePerBag: number;
  sandPricePerM3: number;
  stoneChipsPricePerM3: number;
  rebarPricePerKg: number;
  rebarAllowanceKgPerM3: number;
  admixturePricePerKg: number;
  admixtureDoseKgPerM3: number;
  brickPricePer1000: number;
  // Labor (Daily Wages):
  masonDailyWage: number;
  masonDaysRequired: number;
  laborerDailyWage: number;
  laborerDaysRequired: number;
  barBenderDailyWage: number;
  barBenderDaysRequired: number;
  // Equipment Hire & Shuttering:
  mixerHirePerM3: number;
  vibratorHirePerM3: number;
  shutteringScaffoldingPerM3: number;
  // Charges & Margins:
  waterElectricityPercent: number;
  contractorProfitPercent: number;
  // Local Material Cost Index & Regional Multipliers:
  localCostIndex?: number; // Base 1.00, adjustable local market price escalation index
  materialCostIndex?: number; // Material component escalation factor (default 1.00)
  laborCostIndex?: number; // Labor wage escalation factor (default 1.00)
  equipmentCostIndex?: number; // Equipment & machinery hire factor (default 1.00)
}

/* Module 1: Beam Analysis */
export interface BeamParameters {
  spanLengthM: number;
  uniformLoadKnPerM: number;
  pointLoadKn: number;
  pointLoadPositionM: number;
  elasticModulusGpa: number;
  momentOfInertiaCm4: number;
  supportCondition: SupportCondition;
  allowableStressMpa: number;
  sectionDepthMm: number;
  // Extended boundary & distributed load options (all optional for schema backward compatibility):
  overhangLeftM?: number;
  overhangRightM?: number;
  distributedLoadType?: 'uniform' | 'triangular-increasing' | 'triangular-decreasing' | 'trapezoidal';
  endLoadKnPerM?: number;
  // Governing Building Code & Load Combinations:
  codeStandard?: BuildingCode | 'Eurocode-2' | 'AISC-360';
  deadLoadKnPerM?: number; // Service Dead Load (D)
  liveLoadKnPerM?: number; // Service Live Load (L)
  // BNBC-2020 Seismic & Wind Load Quick Estimator Helper
  seismicZone?: 'Zone 1 (Z=0.12)' | 'Zone 2 (Z=0.20)' | 'Zone 3 (Z=0.28)' | 'Zone 4 (Z=0.36)';
  seismicImportanceI?: number;
  responseReductionR?: number;
  buildingSeismicWeightKn?: number;
  siteSoilClass?: 'SA' | 'SB' | 'SC' | 'SD' | 'SE';
  windDistrict?: string;
  basicWindSpeedMs?: number;
  buildingHeightM?: number;
  tributaryWidthM?: number;
  windExposureCategory?: 'A' | 'B' | 'C';
}

/* Module 2: Bearing Capacity */
export interface BearingParameters {
  footingShape: 'square' | 'strip' | 'circular' | 'rectangular';
  footingWidthM: number;
  footingLengthM?: number;
  embedmentDepthM: number;
  soilCohesionKpa: number;
  frictionAngleDeg: number;
  unitWeightKnPerM3: number;
  waterTableDepthM: number;
  factorOfSafety: number;
  appliedColumnLoadKn: number;
  // Advanced Geotechnical & Settlement Parameters (BNBC-2020 / ACI / Bowles)
  codeStandard?: BuildingCode;
  shallowSolverMethod?: 'meyerhof' | 'terzaghi' | 'hansen';
  boreholeFieldSptN?: number; // Raw measured field SPT blow count (N_field)
  hammerEfficiency?: number; // Hammer energy ratio (typical 0.55 - 0.60 for local donut hammer in Bangladesh)
  sptN60?: number; // Corrected SPT N60 = (N * Em * Cb * Cs * Cr) / 60
  selectedDistrictId?: string; // Auto-lookup district
  elasticModulusEsMpa?: number;
  poissonRatio?: number;
  clayLayerThicknessM?: number;
  compressionIndexCc?: number;
  recompressionIndexCr?: number;
  initialVoidRatioE0?: number;
  overconsolidationRatioOcr?: number;
  permissibleSettlementMm?: number;
  layers?: SoilLayer[];
  // Column Axial & Footing Punching/Beam Shear Check Parameters (BNBC-2020 / ACI 318)
  footingThicknessMm?: number;
  colWidthMm?: number;
  colDepthMm?: number;
  fckMpa?: number;
  fyMpa?: number;
  clearCoverMm?: number;
}

export type EnvironmentalExposureClass =
  | 'F0-normal'
  | 'F1-moderate-freeze'
  | 'S0-negligible-sulfate'
  | 'S1-moderate-sulfate'
  | 'S2-severe-sulfate'
  | 'S3-very-severe-sulfate'
  | 'W0-dry'
  | 'W1-water-contact'
  | 'C0-dry-interior'
  | 'C1-humid-external'
  | 'C2-marine-coastal-deicer';

/* Module 3: Concrete Mix Design */
export interface ConcreteMixParameters {
  targetStrengthMpa: number;
  waterCementRatio: number;
  slumpMm: number;
  maxAggregateSizeMm: number;
  cementSpecificGravity: number;
  fineAggSpecificGravity: number;
  coarseAggSpecificGravity: number;
  airEntrainmentPercent: number;
  batchVolumeM3: number;
  exposureClass?: EnvironmentalExposureClass;
  // Bangladeshi Local Aggregate & Sand Presets:
  coarseAggregateType?: 'crushed-stone' | 'crushed-stone-chips' | 'brick-chips-khoa' | 'gravel';
  sandType?: 'sylhet-sand' | 'local-sand' | 'blended-sand';
  dryVolumeFactor?: number; // 1.54 for stone chips, 1.50 for brick chips khoa per BNBC/PWD
  // ACI 211.1 Advanced Aggregates & Moisture Correction Parameters:
  sandFinenessModulus?: number; // FM e.g. 2.4 - 3.0 (Sylhet FM 2.5-2.8, Local FM 1.2-1.8)
  coarseAggDryRoddedDensityKgPerM3?: number; // DRUW in kg/m³ (stone ~1600, khoa ~1400 kg/m³)
  fineAggAbsorptionPercent?: number; // Fine aggregate absorption % (ASTM C128, default 1.2%)
  fineAggMoisturePercent?: number; // Fine aggregate field total moisture % (ASTM C70, default 4.0%)
  coarseAggAbsorptionPercent?: number; // Coarse aggregate absorption % (Stone 0.8-1.5%, Khoa 8-12%)
  coarseAggMoisturePercent?: number; // Coarse aggregate field total moisture % (ASTM C566, default 2.0%)
  admixtureDosePercent?: number; // Superplasticizer / water reducer % by weight of cement (default 1.0%)
  admixtureSpecificGravity?: number; // Specific gravity of chemical admixture (default 1.15)
  admixtureWaterReductionPercent?: number; // Water reduction efficiency % (default 15%)
}

/* Module 4: Open Channel Hydraulics */
export type ChannelShapeType = 'trapezoidal' | 'rectangular' | 'circular';

export interface ChannelParameters {
  shape?: ChannelShapeType;
  bottomWidthM: number;
  sideSlopeZ: number;
  flowDepthM: number;
  bedSlope: number;
  manningN: number;
  freeboardRequirementM: number;
  diameterM?: number; // Internal diameter for circular conduit / storm sewer open channel
  channelLengthM?: number; // Longitudinal reach length for EGL/HGL profile plotting
  materialId?: string;
}

/* Module 12: Continuous Beam Multi-Span Analysis */
export type TriangularLoadPattern = 'increasing' | 'decreasing' | 'symmetric';

export interface ContinuousBeamSpan {
  id: string;
  spanIndex: number;
  lengthM: number;
  momentOfInertiaCm4: number;
  elasticModulusGpa: number;
  udlKnPerM: number;
  pointLoadKn: number;
  pointLoadPositionM: number;
  triangularLoadKnPerM?: number;
  triangularLoadPattern?: TriangularLoadPattern;
}

export interface ContinuousBeamParameters {
  spanCount: 2 | 3 | 4;
  spans: ContinuousBeamSpan[];
  leftSupport: 'pin' | 'fixed';
  rightSupport: 'pin' | 'fixed';
  allowableStressMpa: number;
  sectionDepthMm: number;
  sectionWidthMm?: number;
  concreteGradeFckMpa?: number;
  steelGradeFyMpa?: number;
  codeStandard?: BuildingCode;
}

/* Module 13: Pile Foundation Bearing Capacity (Deep Foundation) */
export interface SoilLayer {
  id: string;
  name: string;
  thicknessM: number;
  soilType: 'clay' | 'sand' | 'silt' | 'gravel';
  cohesionKpa: number;
  frictionAngleDeg: number;
  unitWeightKnPerM3: number;
  sptN?: number; // Standard Penetration Test blow count N60
  elasticModulusEsMpa?: number; // Soil stiffness Es in MPa
  poissonRatio?: number;
  compressionIndexCc?: number;
  recompressionIndexCr?: number;
  initialVoidRatioE0?: number;
  overconsolidationRatioOcr?: number;
}

export type PileType = 'bored-cast-in-situ' | 'driven-precast' | 'driven-steel-pipe';
export type PileAnalysisMethod = 'alpha-beta' | 'meyerhof-spt' | 'terzaghi-bowles' | 'combined-bnbc';

export interface PileCapacityParameters {
  pileType: PileType;
  method?: PileAnalysisMethod;
  diameterM: number;
  lengthM: number;
  groundwaterDepthM: number;
  appliedLoadKn: number;
  factorOfSafety: number;
  layers: SoilLayer[];
  tipBearingCohesionKpa: number;
  tipBearingFrictionDeg: number;
  tipBearingUnitWeightKnPerM3: number;
  tipSptN?: number;
  codeStandard?: BuildingCode;
  elasticModulusPileGpa?: number;
  permissibleSettlementMm?: number;
  pileConcreteFckMpa?: number;
  // Bored Cast-in-Situ Casing & Bentonite Slurry Specifications (BNBC / PWD):
  casingLengthM?: number; // Temporary steel casing through top alluvium (e.g. 3m - 6m)
  bentoniteSlurryChecked?: boolean; // Polymer / sodium bentonite drilling mud for borehole stability
  bentoniteViscositySec?: number; // Marsh funnel viscosity (typical 30 - 45s)
  bentoniteDensityGPerCc?: number; // Slurry density (typical 1.03 - 1.10 g/cm³)
  // Integrated Pile Cap Concrete & Rebar Estimation:
  pileCapThicknessMm?: number; // Typical 750mm - 1200mm
  pileCapOverhangM?: number; // Pile edge to cap edge clearance (typical 0.15m - 0.30m)
  steelYieldFyMpa?: number;
  pipeWallThicknessMm?: number;
  pileGroupRows?: number;
  pileGroupCols?: number;
  pileSpacingM?: number;
}

/* Module 14: Pipe Hydraulics (Hazen-Williams Pressure & Storm Flow) */
export type PipeMaterialType =
  | 'pvc-hdpe'
  | 'pvc'
  | 'hdpe'
  | 'ductile-iron'
  | 'cast-iron'
  | 'concrete'
  | 'galvanized-steel'
  | 'corrugated-steel';

export type PipeServiceType = 'pressure' | 'gravity-storm' | 'tubewell-plumbing';

export interface PipeHydraulicsParameters {
  serviceType?: PipeServiceType;
  pipeMaterial: PipeMaterialType;
  hazenWilliamsC: number;
  manningN?: number;
  internalDiameterMm: number;
  lengthM: number;
  flowRateLps: number;
  inletElevationM: number;
  outletElevationM: number;
  inletPressureKpa: number;
  minorLossCoefficientK: number;
  waterTempC: number;
  stormFillingRatio?: number;
  // Deep Tubewell, Pump HP & uPVC Plumbing Sizer Sub-Mode (BNBC-2020 Part 8)
  tubewellDepthM?: number;
  staticWaterLevelM?: number;
  drawdownM?: number;
  deliveryHeadM?: number;
  pumpEfficiencyPercent?: number;
  motorEfficiencyPercent?: number;
  upvcClass?: 'Class B (6 bar)' | 'Class C (9 bar)' | 'Class D (12 bar)' | 'Class E (15 bar)';
  // BNBC Plumbing Fixture Units (WSFU / DFU Schedule):
  fixtureWaterClosets?: number;
  fixtureWashBasins?: number;
  fixtureShowers?: number;
  fixtureKitchenSinks?: number;
  fixtureFloorDrains?: number; // FD (strainer floor drain)
  fixtureFloorTraps?: number; // FT (water seal P-trap / floor trap)
  fixtureUrinals?: number;
}

export interface ConcreteMemberItem {
  id: string;
  name: string;
  shape: 'rectangular' | 'circular-column' | 'trapezoidal-footing' | 'retaining-wall-stem';
  count: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  topWidthM?: number;
  topLengthM?: number;
  diameterM?: number;
  computedVolumeM3: number;
}

/* Module 5: Concrete Material Estimator */
export interface ConcreteMaterialParameters {
  code: BuildingCode;
  wetVolumeM3: number;
  ratioCement: number;
  ratioSand: number;
  ratioAggregate: number;
  waterCementRatio: number;
  cementBagWeightKg: number;
  cementBulkDensityKgPerM3: number;
  sandBulkDensityKgPerM3: number;
  aggregateBulkDensityKgPerM3: number;
  customDryFactor: number;
  wastagePercent: number;
  members?: ConcreteMemberItem[];
  coarseAggregateType?: 'crushed-stone' | 'brick-shingles' | 'gravel';
}

/* Module 6: Bar Bending Schedule (BBS) */
export type StructuralElementType =
  | 'slab'
  | 'beam'
  | 'column'
  | 'column-rect'
  | 'circular-column'
  | 'column-circ'
  | 'footing'
  | 'staircase'
  | 'staircase-waist'
  | 'lintel-chajja'
  | 'pile-cage';

export interface RebarBBSParameters {
  elementType: StructuralElementType;
  clearCoverMm: number;
  rebarDensityKgPerM3: number;
  hookAngle: '90' | '135' | '180';
  slabLengthM: number;
  slabWidthM: number;
  slabThicknessMm: number;
  mainBarDiaMm: number;
  mainBarSpacingMm: number;
  distBarDiaMm: number;
  distBarSpacingMm: number;
  // Lapping & 12m Commercial Bar Stock Optimizer
  lappingFactorD?: number; // e.g. 50 (50d) or 60 (60d) for bars exceeding 12m
  commercialBarStockLengthM?: number; // default 12.0m (39.37 ft)
  steelGradeType?: '500W-grade-72.5' | '400W-grade-60' | '300-grade-40' | 'custom';
  seismicDuctileStirrups?: boolean; // BNBC-2020 135° hook with 10db >= 75mm extension & closer spacing at ends
  // Beam BBS fields
  beamLengthM?: number;
  beamWidthMm?: number;
  beamDepthMm?: number;
  beamMainBarDiaMm?: number;
  beamTopBarCount?: number;
  beamBotBarCount?: number;
  beamStirrupDiaMm?: number;
  beamStirrupSpacingMm?: number;
  // Column fields
  colLengthMm: number;
  colWidthMm: number;
  colHeightM: number;
  colMainBarDiaMm: number;
  colMainBarCount: number;
  tieBarDiaMm: number;
  tieSpacingMm: number;
  circColDiaMm: number;
  circColHeightM: number;
  circMainBarDiaMm: number;
  circMainBarCount: number;
  spiralTieDiaMm: number;
  spiralPitchMm: number;
  footingLengthM: number;
  footingWidthM: number;
  footingDepthMm: number;
  footingBarDiaMm: number;
  footingBarSpacingMm: number;
  stairGoingM: number;
  stairTotalRiseM: number;
  waistSlabThicknessMm: number;
  riserMm: number;
  treadMm: number;
  landingLengthM: number;
  stairMainBarDiaMm: number;
  stairMainBarSpacingMm: number;
  stairDistBarDiaMm: number;
  stairDistBarSpacingMm: number;
  // Lintel & Chajja / Sunshade fields
  lintelLengthM?: number;
  lintelWidthMm?: number;
  lintelDepthMm?: number;
  lintelMainBarDiaMm?: number;
  lintelTopBarCount?: number;
  lintelBotBarCount?: number;
  lintelStirrupDiaMm?: number;
  lintelStirrupSpacingMm?: number;
  chajjaProjectionM?: number;
  chajjaRootThicknessMm?: number;
  chajjaTipThicknessMm?: number;
  chajjaMainBarDiaMm?: number;
  chajjaMainBarSpacingMm?: number;
  chajjaDistBarDiaMm?: number;
  chajjaDistBarSpacingMm?: number;
  // Bored Cast-in-Situ Pile Cage fields
  pileDiaMm?: number;
  pileLengthM?: number;
  pileMainBarDiaMm?: number;
  pileMainBarCount?: number;
  pileSpiralDiaMm?: number;
  pileSpiralPitchMm?: number;
  pileStiffenerBarDiaMm?: number;
  pileStiffenerSpacingM?: number;
  pileCutoffEmbedmentM?: number;
}

/* Module 7: Masonry & Finishes */
export interface MasonryOpening {
  id: string;
  name: string;
  widthM: number;
  heightM: number;
  count: number;
  type?: 'window' | 'door' | 'veranda-grill' | 'ventilator';
  includeGrill?: boolean;
  includeThaiAluminum?: boolean;
}

export interface MasonryParameters {
  wallLengthM: number;
  wallHeightM: number;
  wallThicknessM: number;
  brickLengthMm: number;
  brickWidthMm: number;
  brickHeightMm: number;
  mortarJointMm: number;
  mortarRatioCement: number;
  mortarRatioSand: number;
  brickWastagePercent: number;
  openings: MasonryOpening[];
  plasterThicknessMm: number;
  plasterSides: number;
  plasterRatioCement: number;
  plasterRatioSand: number;
  floorLengthM: number;
  floorWidthM: number;
  tileLengthMm: number;
  tileWidthMm: number;
  tilesPerBox: number;
  tileWastagePercent: number;
  includeFrogVoidAllowance?: boolean;
  frogVoidPercent?: number;
  ceilingPlasterAreaM2?: number;
  ceilingPlasterThicknessMm?: number;
  skirtingHeightMm?: number;
  groutJointWidthMm?: number;
  groutDensityKgPerM3?: number;
  // Paint, Wall Putty & Primer Schedule
  puttyCoats?: number;
  puttyCoverageKgPerM2?: number; // default ~0.90 kg/m2
  primerCoverageM2PerL?: number; // default ~11.0 m2/L
  paintCoats?: number;
  paintCoverageM2PerL?: number; // default ~6.5 m2/L
  paintWastagePercent?: number;
  // MS Window/Veranda Grill & Thai Aluminum Schedule
  grillWeightKgPerSft?: number; // default 1.40 kg/sft
  includeGrillSchedule?: boolean;
  includeThaiSchedule?: boolean;
  // Bangladeshi Standard Brick, BFS & HBB Sub-base:
  brickStandardType?: 'bd-pwd-metric' | 'traditional-field' | 'custom';
  wallType?: '125mm-5inch-partition' | '250mm-10inch-loadbearing' | '375mm-15inch' | 'custom';
  subbaseType?: 'none' | 'bfs-flat-soling' | 'hbb-herringbone-bond';
  bfsLayerAreaM2?: number; // Floor / road sub-base Brick Flat Soling area
  bfsSandCushionThicknessMm?: number; // e.g. 25mm to 50mm local sand cushion bed
}

/* Module 8: Earthwork & Road Alignment */
export interface EarthworkParameters {
  calculationType: 'pit-excavation' | 'trapezoidal-trench' | 'prismoidal-road';
  soilType: 'sand-gravel' | 'common-earth' | 'dense-clay' | 'blasted-rock';
  pitTopLengthM: number;
  pitTopWidthM: number;
  pitDepthM: number;
  pitSideSlopeH: number;
  trenchLengthM: number;
  trenchBottomWidthM: number;
  trenchDepthM: number;
  trenchSideSlopeH: number;
  roadLengthM: number;
  formationWidthM: number;
  sideSlopeS: number;
  depthStation1M: number;
  depthStation2M: number;
  depthStation3M: number;
  customSwellPercent?: number;
  customShrinkagePercent?: number;
  haulTruckCapacityM3?: number;
  looseSoilDensityKgPerM3?: number;
}

/* Module 9: Field Surveying, Leveling & Road Chainage */
export interface LevelingStation {
  id: string;
  stationName: string;
  backsight?: number;
  intermediateSight?: number;
  foresight?: number;
  heightOfInstrument?: number;
  rise?: number;
  fall?: number;
  reducedLevel: number;
  remarks: string;
}

export interface SurveyingParameters {
  method: 'height-of-instrument' | 'rise-and-fall';
  benchmarkRL: number;
  stations: LevelingStation[];
  // DMS to Decimal tool
  degrees: number;
  minutes: number;
  seconds: number;
  decimalDegreeOutput: number;
  inputDecimalDegrees: number;
  // Coordinate Azimuth / Bearing tool
  station1Name: string;
  easting1M: number;
  northing1M: number;
  station2Name: string;
  easting2M: number;
  northing2M: number;
  // Computed Land Area & Earthwork Cut/Fill Persistence
  landCalcMode?: '3-sided' | '4-sided' | 'polygon';
  inputUnit?: 'ft' | 'm';
  computedAreaSqM?: number;
  computedAreaSqFt?: number;
  computedExcavationVolumeM3?: number;
  formationRL?: number;
  polygonPoints?: Array<{ id: string; x: number; y: number }>;
  triSides?: { a: number; b: number; c: number };
  quadSides?: { s1: number; s2: number; s3: number; s4: number; diag: number };
  customKathaSqFt?: number;
}

export interface CalculationRecord {
  id: string;
  workspaceId: string;
  moduleId: EngineeringModuleId;
  timestamp: string;
  title: string;
  notes: string;
  status: 'nominal' | 'warning' | 'critical';
  keyMetrics: {
    label: string;
    value: string;
    unit: string;
  }[];
  inputsSnapshot: Record<string, unknown>;
}

/* -------------------------------------------------------------
   ARCHITECTURE, SPACE PLANNING & BY-LAWS PARAMETERS (BNBC 2020)
------------------------------------------------------------- */
export interface FarMgcParameters {
  landUnit: 'katha' | 'decimal' | 'sqft' | 'sqm';
  landAreaValue: number;
  customKathaSqFt: number;
  occupancy: 'residential' | 'commercial' | 'mixed' | 'educational' | 'industrial';
  roadWidthM: number;
  frontageM: number;
  plotDepthM: number;
  isAutoDimension: boolean;
  enableOverride: boolean;
  overrideFar: number;
  overrideMgc: number;
  overrideSetbacks: {
    front: number;
    rear: number;
    side1: number;
    side2: number;
  };
}

export interface StaircaseParameters {
  stairType: 'dog-legged' | 'straight' | 'open-well';
  floorHeightMm: number;
  stairwellLengthMm: number;
  stairwellWidthMm: number;
  preferredRiserMm: number;
  preferredTreadMm: number;
  waistSlabMm: number;
  slabThicknessMm: number;
  landingWidthMm: number;
  nosingMm: number;
  liveLoadKpa: number;
  finishesLoadKpa: number;
}

export interface WaterTankParameters {
  calcMode: 'occupants' | 'building';
  numFloors: number;
  unitsPerFloor: number;
  personsPerUnit: number;
  directOccupants: number;
  floatingPopulation: number;
  lpcd: number;
  storageDays: number;
  fireReserveL: number;
  ugwrSharePercent: number;
  ugwrWaterDepthM: number;
  ugwrLwRatio: number;
  ohtWaterDepthM: number;
  ohtLwRatio: number;
  pumpFillHours: number;
  totalHeadM: number;
}

export interface SepticTankParameters {
  septicUsers: number;
  sewageRateLpcd: number;
  detentionHours: number;
  desludgingYears: number;
  septicDepthM: number;
  septicLwRatio: number;
  soilPercolationRate: number;
  soakPitDiaM: number;
}

export interface ArchitectureParameters {
  farMgc: FarMgcParameters;
  staircase: StaircaseParameters;
  waterTank: WaterTankParameters;
  septicTank: SepticTankParameters;
}

export interface CivilWorkspace {
  id: string;
  name: string;
  projectCode: string;
  siteLocation: string;
  engineerOfRecord: string;
  currency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
  activeModule: EngineeringModuleId;
  governingCode: BuildingCode;
  boq: BOQParameters;
  rateAnalysis: RateAnalysisParameters;
  converter: UnitConverterParameters;
  beam: BeamParameters;
  bearing: BearingParameters;
  concrete: ConcreteMixParameters;
  channel: ChannelParameters;
  concreteMaterials: ConcreteMaterialParameters;
  rebarBbs: RebarBBSParameters;
  masonry: MasonryParameters;
  earthwork: EarthworkParameters;
  surveying?: SurveyingParameters;
  continuousBeam?: ContinuousBeamParameters;
  frameTruss2d?: FrameTruss2DParams;
  sectionAnalyzer?: SectionAnalyzerParams;
  rcColumn?: RcColumnParams;
  strutAndTie?: StrutAndTieParams;
  pile?: PileCapacityParameters;
  pipe?: PipeHydraulicsParameters;
  unitPreferences?: WorkspaceUnitPreferences;
  architecture?: ArchitectureParameters;
}

/* -------------------------------------------------------------
   2D FRAME & TRUSS DIRECT STIFFNESS + SECOND-ORDER P-DELTA
------------------------------------------------------------- */
export type FrameTruss2DSupportType =
  | 'none'
  | 'pin'
  | 'roller-x'
  | 'roller-y'
  | 'fixed'
  | 'spring';

export interface FrameTruss2DNode {
  id: string;
  label: string;
  xM: number;
  yM: number;
  support: FrameTruss2DSupportType;
  springKx?: number; // kN/m
  springKy?: number; // kN/m
  springKr?: number; // kN·m/rad
}

export interface FrameTruss2DMember {
  id: string;
  label: string;
  startNodeId: string;
  endNodeId: string;
  memberType: 'frame' | 'truss';
  startHinge: boolean;
  endHinge: boolean;
  areaCm2: number;
  inertiaCm4: number;
  elasticModulusGpa: number;
  udlKnPerM: number;
  pointLoadKn: number;
  pointLoadRatio: number; // 0..1 along local member axis from startNode
}

export interface FrameTruss2DNodalLoad {
  nodeId: string;
  fxKn: number;
  fyKn: number;
  mzKnm: number;
}

export type FrameTruss2DAnalysisMode = 'first-order-linear' | 'second-order-p-delta';

export interface FrameTruss2DParams {
  code?: BuildingCode;
  presetName?: string;
  nodes: FrameTruss2DNode[];
  members: FrameTruss2DMember[];
  nodalLoads: FrameTruss2DNodalLoad[];
  analysisMode: FrameTruss2DAnalysisMode;
  allowableStressMpa?: number;
  sectionDepthMm?: number;
  thermalDeltaC?: number; // Explicit diagnostic if non-zero in P-Delta mode
}

/* -------------------------------------------------------------
   SECTION MECHANICS, STRESSES & PLASTIC N-M INTERACTION
------------------------------------------------------------- */
export type SectionShapeType =
  | 'rectangular'
  | 'circular'
  | 'hollow-box'
  | 'i-beam'
  | 't-section'
  | 'channel'
  | 'custom-polygon';

export type SectionStandardCode = 'Eurocode-3' | 'AISC-360' | 'BNBC-2020';

export interface SectionPolygonVertex {
  id: string;
  yMm: number;
  zMm: number;
}

export interface SectionAnalyzerParams {
  shape: SectionShapeType;
  presetId?: string;
  designCode: SectionStandardCode;
  // Geometric dimensions in mm
  depthH_Mm: number;
  widthB_Mm: number;
  webThicknessTw_Mm: number;
  flangeThicknessTf_Mm: number;
  wallThicknessT_Mm: number;
  polygonPointsMm: SectionPolygonVertex[];
  // Material & resistance parameters
  fyMpa: number;
  elasticModulusGpa: number;
  gammaM0: number;
  // Applied Internal Forces (tension positive for N -> sigma = N/A + My*z/Iy - Mz*y/Iz)
  axialForceN_Kn: number;
  momentMy_Knm: number;
  momentMz_Knm: number;
  shearVy_Kn: number;
  shearVz_Kn: number;
  torsionT_Knm: number;
}

/* -------------------------------------------------------------
   RC COLUMN UNIAXIAL & BIAXIAL N-M INTERACTION + SLENDERNESS
------------------------------------------------------------- */
export type RcColumnDesignCode = 'BNBC-2020' | 'ACI-318-19' | 'Eurocode-2';

export interface RcColumnParams {
  designCode: RcColumnDesignCode;
  widthB_Mm: number; // Column width b (mm)
  depthH_Mm: number; // Column depth h (mm)
  clearCoverMm: number; // Clear concrete cover to ties (mm)
  unsupportedLengthLu_M: number; // Unsupported height Lu (m)
  effectiveLengthFactorK: number; // k factor (e.g. 0.85 braced, 1.3 unbraced)
  isBracedFrame: boolean;
  concreteFcMpa: number; // Cylinder f'c (MPa)
  rebarFyMpa: number; // Longitudinal yield fy (MPa)
  longitudinalBarDiaMm: number; // Main rebar diameter (mm)
  barsAlongWidthB: number; // Bars on each b-face (>= 2)
  barsAlongDepthH: number; // Bars on each h-face (>= 2)
  tieBarDiaMm: number; // Transverse tie diameter (mm)
  tieSpacingMm: number; // Tie spacing c/c (mm)
  axialLoadPu_Kn: number; // Factored axial load Pu (kN, compression positive)
  momentMux_Knm: number; // Factored bending moment about X-axis / depth h (kN·m)
  momentMuy_Knm: number; // Factored bending moment about Y-axis / width b (kN·m)
  sustainedLoadRatioBetaDns?: number; // Sustained axial load ratio beta_dns (0..1)
}

/* -------------------------------------------------------------
   STRUT-AND-TIE MODEL (STM) DISCONTINUITY SOLVER
------------------------------------------------------------- */
export type StmSupportType = 'none' | 'pin' | 'roller-x' | 'roller-y';

export interface StmNode {
  id: string;
  label: string;
  xM: number;
  yM: number;
  support: StmSupportType;
}

export interface StmMember {
  id: string;
  label: string;
  startNodeId: string;
  endNodeId: string;
  areaCm2: number;
  strutBetaS?: number; // Efficiency factor beta_s (default 0.75)
}

export interface StmNodalLoad {
  nodeId: string;
  fxKn: number;
  fyKn: number;
}

export interface StrutAndTieParams {
  presetId?: string;
  presetName: string;
  code: BuildingCode;
  memberThicknessMm: number;
  concreteFcMpa: number;
  rebarFyMpa: number;
  nodes: StmNode[];
  members: StmMember[];
  nodalLoads: StmNodalLoad[];
}

/* -------------------------------------------------------------
   USER PROFILE, CUSTOM PREFERENCES & PRESET SYSTEM
------------------------------------------------------------- */
export type UserRole =
  | 'structural-engineer'
  | 'civil-site-engineer'
  | 'geotechnical-engineer'
  | 'estimator-qs'
  | 'project-manager'
  | 'consultant'
  | 'engineering-student'
  | 'researcher-academic'
  | 'contractor';

export interface UserProfile {
  fullName: string;
  designation: string;
  organization: string;
  role: UserRole;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  initials?: string;
  bio?: string;
}

export interface RegionalLandRules {
  kathaSquareFeet: number; // default 720 (Standard Bangladesh/Bengal), 1361.25 (Bihar)
  decimalSquareFeet: number; // default 435.6
  bighaDecimals: number; // default 33 (or 20 kathas)
  defaultLandUnit: 'decimal' | 'katha' | 'bigha' | 'acre' | 'sqft' | 'sqm';
}

export interface WastageDefaults {
  concretePercent: number; // default 3.0
  rebarPercent: number; // default 5.0
  brickMortarPercent: number; // default 5.0
  earthworkShrinkagePercent: number; // default 10.0
}

export interface UserCustomPreferences {
  preferredUnitSystem: 'metric' | 'imperial' | 'mixed' | 'regional';
  decimalPrecision: number; // 0, 1, 2, 3, 4 (default 2)
  defaultCementBagWeightKg: number; // 50, 40, 42.6 (94lb)
  defaultCurrency: CurrencyCode; // default BDT
  defaultBuildingCode: BuildingCode; // default BNBC-2020
  wastage: WastageDefaults;
  regionalLand: RegionalLandRules;
  reportHeaderNote?: string;
  showEngineeringSignatureLine: boolean;
  autoLogSnapshotsOnPrint: boolean;
  compactNumberFormatting: boolean;
}

export type PresetCategory =
  | 'concrete-mix'
  | 'material-rates'
  | 'structural-beam'
  | 'bearing-soil'
  | 'earthwork-hydraulics'
  | 'complete-workspace';

export interface EngineeringPreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  tags: string[];
  isBuiltIn?: boolean;
  createdAt: string;
  updatedAt: string;
  author?: string;
  payload: {
    targetModule?: EngineeringModuleId;
    concreteMix?: Partial<ConcreteMixParameters>;
    concreteMaterials?: Partial<ConcreteMaterialParameters>;
    rateAnalysis?: Partial<RateAnalysisParameters>;
    beam?: Partial<BeamParameters>;
    bearing?: Partial<BearingParameters>;
    earthwork?: Partial<EarthworkParameters>;
    channel?: Partial<ChannelParameters>;
    masonry?: Partial<MasonryParameters>;
    rebarBbs?: Partial<RebarBBSParameters>;
    boq?: Partial<BOQParameters>;
    continuousBeam?: Partial<ContinuousBeamParameters>;
    frameTruss2d?: Partial<FrameTruss2DParams>;
    sectionAnalyzer?: Partial<SectionAnalyzerParams>;
    rcColumn?: Partial<RcColumnParams>;
    strutAndTie?: Partial<StrutAndTieParams>;
    pile?: Partial<PileCapacityParameters>;
    pipe?: Partial<PipeHydraulicsParameters>;
    surveying?: Partial<SurveyingParameters>;
  };
}

export interface CivilLabSchemaV2 {
  schemaVersion: 2 | 3;
  lastMigratedAt: string;
  migratedFromVersion: number | null;
  themePreference: ThemePreference;
  sidebarCollapsed: boolean;
  splitRatioPercent: number;
  activeWorkspaceId: string;
  customUnits: CustomUnitDefinition[];
  commandRecentQueries: string[];
  workspaces: CivilWorkspace[];
  calculationHistory: CalculationRecord[];
  userProfile?: UserProfile;
  userPreferences?: UserCustomPreferences;
  presets?: EngineeringPreset[];
}

export type CivilLabSchemaV3 = CivilLabSchemaV2;

export interface LegacySchemaV1 {
  schemaVersion?: 1;
  version?: number;
  theme?: 'light' | 'dark' | 'system';
  projectName?: string;
  projectCode?: string;
  beamSpan?: number;
  beamLoad?: number;
  footingWidth?: number;
  soilCohesion?: number;
  history?: Array<{
    title?: string;
    date?: string;
    result?: string;
  }>;
}

