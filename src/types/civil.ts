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
  | 'pile-capacity'
  | 'pipe-hydraulics';

export type BuildingCode = 'BNBC-2020' | 'ACI-318' | 'IS-456';

export type SupportCondition = 'simply-supported' | 'cantilever' | 'fixed-ends';

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
  | 'flow_rate';

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

export interface TakeoffLineItem {
  id: string;
  itemNo: string;
  description: string;
  category: TakeoffCategory;
  numberOfMembers: number; // Multiplier / Nos (>= 1)
  lengthM: number;
  widthM: number;
  heightM: number;
  deductionQty: number; // Volume/Area to deduct (e.g. doors/windows)
  unit: TakeoffUnit;
  wastagePercent: number; // e.g. 3-5%
  unitRate: number; // price per unit in workspace currency
}

export interface BOQParameters {
  currency: CurrencyCode;
  contingencyPercent: number; // e.g. 3%
  contractorOverheadPercent: number; // CP&OH e.g. 10%
  vatTaxPercent: number; // e.g. 7.5% or 15%
  items: TakeoffLineItem[];
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
}

/* Module 4: Open Channel Hydraulics */
export interface ChannelParameters {
  bottomWidthM: number;
  sideSlopeZ: number;
  flowDepthM: number;
  bedSlope: number;
  manningN: number;
  freeboardRequirementM: number;
}

/* Module 12: Continuous Beam Multi-Span Analysis */
export interface ContinuousBeamSpan {
  id: string;
  spanIndex: number;
  lengthM: number;
  momentOfInertiaCm4: number;
  elasticModulusGpa: number;
  udlKnPerM: number;
  pointLoadKn: number;
  pointLoadPositionM: number;
}

export interface ContinuousBeamParameters {
  spanCount: 2 | 3 | 4;
  spans: ContinuousBeamSpan[];
  leftSupport: 'pin' | 'fixed';
  rightSupport: 'pin' | 'fixed';
  allowableStressMpa: number;
  sectionDepthMm: number;
}

/* Module 13: Pile Foundation Bearing Capacity (Deep Foundation) */
export interface SoilLayer {
  id: string;
  name: string;
  thicknessM: number;
  soilType: 'clay' | 'sand';
  cohesionKpa: number;
  frictionAngleDeg: number;
  unitWeightKnPerM3: number;
}

export type PileType = 'bored-cast-in-situ' | 'driven-precast' | 'driven-steel-pipe';

export interface PileCapacityParameters {
  pileType: PileType;
  diameterM: number;
  lengthM: number;
  groundwaterDepthM: number;
  appliedLoadKn: number;
  factorOfSafety: number;
  layers: SoilLayer[];
  tipBearingCohesionKpa: number;
  tipBearingFrictionDeg: number;
  tipBearingUnitWeightKnPerM3: number;
}

/* Module 14: Pipe Hydraulics (Hazen-Williams Pressure & Storm Flow) */
export type PipeMaterialType =
  | 'pvc-hdpe'
  | 'ductile-iron'
  | 'cast-iron'
  | 'concrete'
  | 'galvanized-steel';

export interface PipeHydraulicsParameters {
  pipeMaterial: PipeMaterialType;
  hazenWilliamsC: number;
  internalDiameterMm: number;
  lengthM: number;
  flowRateLps: number;
  inletElevationM: number;
  outletElevationM: number;
  inletPressureKpa: number;
  minorLossCoefficientK: number;
  waterTempC: number;
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
  | 'column'
  | 'column-rect'
  | 'circular-column'
  | 'column-circ'
  | 'footing'
  | 'staircase'
  | 'staircase-waist';

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
}

/* Module 7: Masonry & Finishes */
export interface MasonryOpening {
  id: string;
  name: string;
  widthM: number;
  heightM: number;
  count: number;
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
  pile?: PileCapacityParameters;
  pipe?: PipeHydraulicsParameters;
  unitPreferences?: WorkspaceUnitPreferences;
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
  };
}

export interface CivilLabSchemaV2 {
  schemaVersion: 2;
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

