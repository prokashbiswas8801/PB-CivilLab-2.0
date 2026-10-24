import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
  Plus,
  BookmarkCheck,
  History,
  Database,
  Download,
  Upload,
  RotateCcw,
  RotateCw,
  Bug,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  SlidersHorizontal,
  HardHat,
  Waves,
  Boxes,
  Hammer,
  Grid,
  Shovel,
  Sparkles,
  Search,
  Scale,
  Settings,
  FileSpreadsheet,
  Calculator,
  Coins,
  Copy,
  Edit3,
  FolderArchive,
  ArrowRight,
  ArrowRightLeft,
  Filter,
  ShieldCheck,
  HardDrive,
  Printer,
  User,
  Award,
  Table,
  Activity,
  Columns,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
} from 'lucide-react';
import {
  exportAnalyticalScheduleCsv,
  getGoverningEquations,
  getCapacityUtilization,
  getAllCapacityUtilizations,
} from './utils/analyticalExport';
import { Logo, LogoMark, BrandLogoIcon, BRAND_LOGO_SRC } from './components/Logo';
import { Footer } from './components/Footer';
import { AppSplash } from './components/AppSplash';
import {
  CivilLabSchemaV2,
  CivilWorkspace,
  EngineeringModuleId,
  ThemePreference,
  CalculationRecord,
  BuildingCode,
  StructuralElementType,
  UnitCategoryKey,
  CustomUnitDefinition,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  TakeoffLineItem,
  TakeoffUnit,
  TakeoffCategory,
  RateAnalysisWorkType,
  UnitSystemPreset,
  WorkspaceUnitPreferences,
  UserProfile,
  UserCustomPreferences,
  EngineeringPreset,
} from './types/civil';
import {
  loadPersistedState,
  savePersistedState,
  generateUUID,
  simulateV1MigrationSample,
  clearAndResetStorage,
  restoreStateFromIndexedDB,
  createCleanSchemaV2,
  createDemoSchemaV2,
  createDemoWorkspaces,
  createSampleBOQItems,
  createInitialHistory,
  STORAGE_KEY,
  CURRENT_SCHEMA_VERSION,
  exportProjectWorkspacePackage,
  parseAndValidateProjectWorkspacePackage,
  createDefaultUserProfile,
  createDefaultUserPreferences,
  createDefaultEngineeringPresets,
} from './utils/storage';
import { getIndexedDBStats, isIndexedDBSupported, persistToIndexedDB } from './utils/indexedStorage';
import {
  computeBeamAnalysis,
  computeBearingCapacity,
  computeConcreteMix,
  computeChannelHydraulics,
  computeConcreteMaterials,
  computeRebarBBS,
  computeMasonryFinishes,
  computeEarthwork,
  computeBOQEstimator,
  computeRateAnalysis,
  computeContinuousBeam,
  computePileCapacity,
  computePipeHydraulics,
  getCurrencySymbol,
  BeamAnalysisResult,
  BearingAnalysisResult,
  ChannelHydraulicsResult,
  ContinuousBeamResult,
  PileCapacityResult,
  PipeHydraulicsResult,
} from './utils/calculations';
import {
  convertUnitValue,
  parseFeetInchString,
  STANDARD_UNITS,
  BASE_UNITS,
} from './utils/unitConverter';
import {
  BeamDiagramSvg,
  BearingDiagramSvg,
  ConcreteMixSvg,
  ChannelHydraulicsSvg,
  ConcreteMaterialsDiagramSvg,
  RebarBBSDiagramSvg,
  MasonryDiagramSvg,
  EarthworkDiagramSvg,
  UnitConverterDiagramSvg,
  BOQCostBreakdownDiagramSvg,
  RateAnalysisBreakdownDiagramSvg,
  ContinuousBeamDiagramSvg,
  PileCapacityDiagramSvg,
  PipeHydraulicsDiagramSvg,
} from './components/EngineeringDiagrams';
import { CommandPalette } from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UnitInput } from './components/UnitInput';
import { UnitValueDisplay } from './components/UnitValueDisplay';
import { UnitPresetSelector } from './components/UnitPresetSelector';
import { ProfilePreferencesModal } from './components/ProfilePreferencesModal';
import { PresetQuickBar } from './components/PresetQuickBar';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { AnalyticalDenseTable } from './components/AnalyticalDenseTable';
import { DashboardView } from './components/DashboardView';
import { DcrCapacityGauge, DcrGaugeSuite } from './components/DcrCapacityGauge';
import { CelebrationToast, ToastMessage } from './components/CelebrationToast';
import { exportCertifiedEngineeringPdf, PdfExportProgress } from './utils/pdfExport';
import { PdfExportProgressModal } from './components/PdfExportProgressModal';
import { syncAllModulesToBoq } from './utils/boqAutoSync';
import { generateReportQrCode, GeneratedReportQrResult } from './utils/qrCode';
import {
  WorkspaceManagerModal,
  EditWorkspaceModal,
  NewWorkspaceModal,
  CustomUnitModal,
  PersistenceInspectorModal,
  HistoryDrawer,
} from './components/modals';
import { FloatingActionBar } from './components/FloatingActionBar';
import { WorkflowCrossLinkBanner } from './components/WorkflowCrossLinkBanner';
import {
  BoqEstimatorInputs,
  BoqEstimatorTable,
  RateAnalysisInputs,
  RateAnalysisTables,
  UnitConverterInputs,
  UnitConverterMetrics,
  ConcreteMaterialsInputs,
  ConcreteMaterialsMetrics,
  RebarBbsInputs,
  RebarBbsMetrics,
  MasonryFinishesInputs,
  MasonryFinishesMetrics,
  EarthworkAlignmentInputs,
  EarthworkAlignmentMetrics,
  BeamAnalysisInputs,
  BeamAnalysisMetrics,
  BearingCapacityInputs,
  BearingCapacityMetrics,
  ConcreteMixInputs,
  ConcreteMixMetrics,
  OpenChannelInputs,
  OpenChannelMetrics,
  ContinuousBeamInputs,
  ContinuousBeamMetrics,
  PileCapacityInputs,
  PileCapacityMetrics,
  PipeHydraulicsInputs,
  PipeHydraulicsMetrics,
  CalculationHistoryLedger,
} from './components/modules';
import { SYSTEM_PRESET_UNITS } from './utils/unitEngine';

const MODULE_META: Record<
  EngineeringModuleId,
  { label: string; shortLabel: string; codeStandard: string; icon: React.ComponentType<{ className?: string }> }
> = {
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
};

function RuntimeFaultProbe({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error(
      'Simulated Structural Matrix Singularity (User-triggered ErrorBoundary verification test)'
    );
  }
  return null;
}

export default function App() {
  const [appState, setAppState] = useState<CivilLabSchemaV2>(() => loadPersistedState());
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<CivilWorkspace[]>([]);
  const [redoStack, setRedoStack] = useState<CivilWorkspace[]>([]);
  const [customUnitModalOpen, setCustomUnitModalOpen] = useState(false);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);
  const [osDarkPreference, setOsDarkPreference] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsCode, setNewWsCode] = useState('');
  const [newWsSite, setNewWsSite] = useState('');
  const [newWsEngineer, setNewWsEngineer] = useState('');
  const [newWsCurrency, setNewWsCurrency] = useState<CurrencyCode>('BDT');
  const [newWsTemplate, setNewWsTemplate] = useState<'clean' | 'clone' | 'demo'>('clean');

  // IndexedDB Local-First Diagnostics State
  const [idbDiagnostics, setIdbDiagnostics] = useState<{
    supported: boolean;
    hasStoredState: boolean;
    lastPersistedTime?: string;
    approxSizeChars: number;
    syncing?: boolean;
  }>({
    supported: isIndexedDBSupported(),
    hasStoredState: false,
    approxSizeChars: 0,
  });

  // Edit Workspace Modal state
  const [editWsModalOpen, setEditWsModalOpen] = useState(false);
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editWsName, setEditWsName] = useState('');
  const [editWsCode, setEditWsCode] = useState('');
  const [editWsSite, setEditWsSite] = useState('');
  const [editWsEngineer, setEditWsEngineer] = useState('');
  const [editWsCurrency, setEditWsCurrency] = useState<CurrencyCode>('BDT');

  // History filters
  const [historyFilter, setHistoryFilter] = useState<'all' | EngineeringModuleId>('all');
  const [historyScope, setHistoryScope] = useState<'active-project' | 'all-projects'>('active-project');
  const [historySearch, setHistorySearch] = useState('');
  const [triggerErrorTest, setTriggerErrorTest] = useState(false);
  const [celebrationToast, setCelebrationToast] = useState<ToastMessage | null>(null);
  const [sunlightMode, setSunlightMode] = useState<boolean>(false);

  const triggerCelebration = (
    title: string,
    description?: string,
    type: ToastMessage['type'] = 'celebrate'
  ) => {
    setCelebrationToast({
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      description,
      type,
      duration: 4500,
    });
  };

  const setToastBanner = (msg: string | null) => {
    if (!msg) {
      setCelebrationToast(null);
    } else {
      triggerCelebration(msg, undefined, 'info');
    }
  };
  const [showSplash, setShowSplash] = useState(true);
  const [profilePreferencesModalOpen, setProfilePreferencesModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'preferences' | 'presets'>('profile');
  const [printPreviewModalOpen, setPrintPreviewModalOpen] = useState(false);
  const [analyticalViewMode, setAnalyticalViewMode] = useState<'graphical' | 'tabular' | 'both'>('graphical');
  const [isTableCompact, setIsTableCompact] = useState(false);
  const [denseTableSearch, setDenseTableSearch] = useState('');
  const [showGoverningEquations, setShowGoverningEquations] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isDashboardView, setIsDashboardView] = useState(true);
  const [activeReportQr, setActiveReportQr] = useState<GeneratedReportQrResult | null>(null);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectFileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom Unit form state
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  const [newUnitCategory, setNewUnitCategory] = useState<UnitCategoryKey>('length');
  const [newUnitFactor, setNewUnitFactor] = useState(1.0);
  const [newUnitDesc, setNewUnitDesc] = useState('');

  // BOQ Item Form & Filter State
  const [boqCategoryFilter, setBoqCategoryFilter] = useState<'all' | TakeoffCategory>('all');
  const [editingTakeoffItemId, setEditingTakeoffItemId] = useState<string | null>(null);
  const [itemNo, setItemNo] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemCategory, setItemCategory] = useState<TakeoffCategory>('substructure');
  const [itemMembers, setItemMembers] = useState(1);
  const [itemLength, setItemLength] = useState(0);
  const [itemWidth, setItemWidth] = useState(0);
  const [itemHeight, setItemHeight] = useState(0);
  const [itemDeduction, setItemDeduction] = useState(0);
  const [itemUnit, setItemUnit] = useState<TakeoffUnit>('m3');
  const [itemWastage, setItemWastage] = useState(3.0);
  const [itemUnitRate, setItemUnitRate] = useState(0);
  // Keyboard shortcuts managed comprehensively below alongside undo/redo engine

  // Resilient Local-First IndexedDB Hydration Fallback:
  // If localStorage was cleared, empty, or storage pressure dropped it, attempt immediate recovery from IndexedDB
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasLocal = localStorage.getItem(STORAGE_KEY);
    if (!hasLocal) {
      restoreStateFromIndexedDB().then((restored) => {
        if (restored && restored.workspaces && restored.workspaces.length > 0) {
          setAppState(restored);
          setToastBanner('Restored local-first workspace state from IndexedDB backup.');
        }
      });
    }
  }, []);

  const refreshIdbStats = async () => {
    try {
      const stats = await getIndexedDBStats();
      setIdbDiagnostics(stats);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (inspectorModalOpen) {
      refreshIdbStats();
    }
  }, [inspectorModalOpen]);

  // Sync with localStorage on every state update
  useEffect(() => {
    savePersistedState(appState);
  }, [appState]);

  // Real-time OS Theme Preference Listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setOsDarkPreference(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Resolve Effective Theme & sync .dark class on <html>
  const effectiveTheme: 'light' | 'dark' =
    appState.themePreference === 'system'
      ? osDarkPreference
        ? 'dark'
        : 'light'
      : appState.themePreference;

  useEffect(() => {
    const root = document.documentElement;
    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (sunlightMode) {
      root.classList.add('sunlight-mode');
    } else {
      root.classList.remove('sunlight-mode');
    }
  }, [effectiveTheme, sunlightMode]);

  const activeWorkspace: CivilWorkspace = useMemo(() => {
    return (
      appState.workspaces.find((w) => w.id === appState.activeWorkspaceId) ||
      appState.workspaces[0]
    );
  }, [appState.workspaces, appState.activeWorkspaceId]);

  const userProfile: UserProfile = useMemo(
    () => appState.userProfile || createDefaultUserProfile(),
    [appState.userProfile]
  );

  const userPreferences: UserCustomPreferences = useMemo(
    () => appState.userPreferences || createDefaultUserPreferences(),
    [appState.userPreferences]
  );

  const presets: EngineeringPreset[] = useMemo(
    () => appState.presets || createDefaultEngineeringPresets(),
    [appState.presets]
  );

  const activeModule = activeWorkspace.activeModule;

  // Active Unit Converter Computation
  const activeConversionResult = useMemo(() => {
    return convertUnitValue(
      activeWorkspace.converter.inputValue,
      activeWorkspace.converter.fromUnit,
      activeWorkspace.converter.toUnit,
      activeWorkspace.converter.category,
      appState.customUnits
    );
  }, [
    activeWorkspace.converter.inputValue,
    activeWorkspace.converter.fromUnit,
    activeWorkspace.converter.toUnit,
    activeWorkspace.converter.category,
    appState.customUnits,
  ]);

  // Feet-Inch Decimal Parser Computation
  const activeFeetInchResult = useMemo(() => {
    return parseFeetInchString(activeWorkspace.converter.feetInchRawString);
  }, [activeWorkspace.converter.feetInchRawString]);

  // BOQ & Rate Analysis Envelopes
  const boqEnvelope = useMemo(
    () => computeBOQEstimator(activeWorkspace.boq),
    [activeWorkspace.boq]
  );
  const rateAnalysisEnvelope = useMemo(
    () => computeRateAnalysis(activeWorkspace.rateAnalysis),
    [activeWorkspace.rateAnalysis]
  );

  // Authoritative Enveloped Calculations for Structural / Geotech
  const matEnvelope = useMemo(
    () => computeConcreteMaterials(activeWorkspace.concreteMaterials),
    [activeWorkspace.concreteMaterials]
  );
  const bbsEnvelope = useMemo(
    () => computeRebarBBS(activeWorkspace.rebarBbs),
    [activeWorkspace.rebarBbs]
  );
  const masonryEnvelope = useMemo(
    () => computeMasonryFinishes(activeWorkspace.masonry),
    [activeWorkspace.masonry]
  );
  const earthworkEnvelope = useMemo(
    () => computeEarthwork(activeWorkspace.earthwork),
    [activeWorkspace.earthwork]
  );
  const beamEnvelope = useMemo(
    () => computeBeamAnalysis(activeWorkspace.beam),
    [activeWorkspace.beam]
  );
  const bearingEnvelope = useMemo(
    () => computeBearingCapacity(activeWorkspace.bearing),
    [activeWorkspace.bearing]
  );
  const concreteEnvelope = useMemo(
    () => computeConcreteMix(activeWorkspace.concrete),
    [activeWorkspace.concrete]
  );
  const channelEnvelope = useMemo(
    () => computeChannelHydraulics(activeWorkspace.channel),
    [activeWorkspace.channel]
  );

  // Fallbacks for newly integrated modules if undefined in legacy workspace
  const defaultContinuousBeam = useMemo(() => ({
    spanCount: 3 as const,
    spans: [
      { id: 's1', spanIndex: 0, lengthM: 6.0, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 25.0, pointLoadKn: 40.0, pointLoadPositionM: 3.0 },
      { id: 's2', spanIndex: 1, lengthM: 7.5, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 30.0, pointLoadKn: 60.0, pointLoadPositionM: 3.75 },
      { id: 's3', spanIndex: 2, lengthM: 5.5, momentOfInertiaCm4: 120000, elasticModulusGpa: 200, udlKnPerM: 20.0, pointLoadKn: 30.0, pointLoadPositionM: 2.75 },
    ],
    leftSupport: 'pin' as const,
    rightSupport: 'pin' as const,
    allowableStressMpa: 250,
    sectionDepthMm: 600,
  }), []);

  const defaultPile = useMemo(() => ({
    pileType: 'bored-cast-in-situ' as const,
    diameterM: 0.6,
    lengthM: 22.0,
    groundwaterDepthM: 3.0,
    appliedLoadKn: 1650,
    factorOfSafety: 2.5,
    layers: [
      { id: 'l1', name: 'Soft Silty Clay (Overburden)', thicknessM: 6.0, soilType: 'clay' as const, cohesionKpa: 28, frictionAngleDeg: 0, unitWeightKnPerM3: 17.5 },
      { id: 'l2', name: 'Medium Dense Silty Sand', thicknessM: 8.0, soilType: 'sand' as const, cohesionKpa: 0, frictionAngleDeg: 30, unitWeightKnPerM3: 18.5 },
      { id: 'l3', name: 'Dense Bearing Sand & Gravel', thicknessM: 10.0, soilType: 'sand' as const, cohesionKpa: 0, frictionAngleDeg: 36, unitWeightKnPerM3: 20.0 },
    ],
    tipBearingCohesionKpa: 0,
    tipBearingFrictionDeg: 36,
    tipBearingUnitWeightKnPerM3: 20.0,
  }), []);

  const defaultPipe = useMemo(() => ({
    pipeMaterial: 'pvc-hdpe' as const,
    hazenWilliamsC: 150,
    internalDiameterMm: 250,
    lengthM: 180,
    flowRateLps: 45,
    inletElevationM: 25.0,
    outletElevationM: 18.0,
    inletPressureKpa: 300,
    minorLossCoefficientK: 2.0,
    waterTempC: 20,
  }), []);

  const continuousBeamEnvelope = useMemo(
    () => computeContinuousBeam(activeWorkspace.continuousBeam || defaultContinuousBeam),
    [activeWorkspace.continuousBeam, defaultContinuousBeam]
  );
  const pileEnvelope = useMemo(
    () => computePileCapacity(activeWorkspace.pile || defaultPile),
    [activeWorkspace.pile, defaultPile]
  );
  const pipeEnvelope = useMemo(
    () => computePipeHydraulics(activeWorkspace.pipe || defaultPipe),
    [activeWorkspace.pipe, defaultPipe]
  );

  // Active Envelope
  const currentEnvelope = useMemo(() => {
    switch (activeModule) {
      case 'boq-estimator': return boqEnvelope;
      case 'rate-analysis': return rateAnalysisEnvelope;
      case 'unit-converter':
        return {
          status: 'valid' as const,
          issues: [],
          result: activeConversionResult,
        };
      case 'concrete-materials': return matEnvelope;
      case 'rebar-bbs': return bbsEnvelope;
      case 'masonry-finishes': return masonryEnvelope;
      case 'earthwork-alignment': return earthworkEnvelope;
      case 'beam-analysis': return beamEnvelope;
      case 'bearing-capacity': return bearingEnvelope;
      case 'concrete-mix': return concreteEnvelope;
      case 'open-channel': return channelEnvelope;
      case 'continuous-beam': return continuousBeamEnvelope;
      case 'pile-capacity': return pileEnvelope;
      case 'pipe-hydraulics': return pipeEnvelope;
      default: return boqEnvelope;
    }
  }, [
    activeModule,
    boqEnvelope,
    rateAnalysisEnvelope,
    activeConversionResult,
    matEnvelope,
    bbsEnvelope,
    masonryEnvelope,
    earthworkEnvelope,
    beamEnvelope,
    bearingEnvelope,
    concreteEnvelope,
    channelEnvelope,
    continuousBeamEnvelope,
    pileEnvelope,
    pipeEnvelope,
  ]);

  // Live Capacity Utilization / Demand-Capacity Ratio (DCR) Assessment
  const capacityInfo = useMemo(() => {
    return getCapacityUtilization(activeModule, activeWorkspace, currentEnvelope);
  }, [activeModule, activeWorkspace, currentEnvelope]);

  // All relevant Demand-Capacity Ratio (DCR) limit-state gauges for the active module
  const capacityGauges = useMemo(() => {
    return getAllCapacityUtilizations(activeModule, activeWorkspace, currentEnvelope);
  }, [activeModule, activeWorkspace, currentEnvelope]);

  // Governing Code Equations & Formulations Reference
  const governingEqInfo = useMemo(() => {
    return getGoverningEquations(activeModule);
  }, [activeModule]);

  const updateActiveWorkspace = (updater: (ws: CivilWorkspace) => CivilWorkspace) => {
    // Push current activeWorkspace to undo stack (capped at 25 snapshots)
    setUndoStack((prev) => [activeWorkspace, ...prev.slice(0, 24)]);
    setRedoStack([]); // Fresh modification invalidates redo branch

    setAppState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === activeWorkspace.id
          ? { ...updater(ws), updatedAt: new Date().toISOString() }
          : ws
      ),
    }));
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      setToastBanner('Undo stack is empty.');
      return;
    }
    const [previousWs, ...remainingUndo] = undoStack;
    setUndoStack(remainingUndo);
    setRedoStack((prev) => [activeWorkspace, ...prev.slice(0, 24)]);
    setAppState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === previousWs.id ? previousWs : ws
      ),
    }));
    triggerCelebration('Undid Change', `Restored previous calculation parameters for "${previousWs.name}"`, 'info');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      setToastBanner('Redo stack is empty.');
      return;
    }
    const [nextWs, ...remainingRedo] = redoStack;
    setRedoStack(remainingRedo);
    setUndoStack((prev) => [activeWorkspace, ...prev.slice(0, 24)]);
    setAppState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === nextWs.id ? nextWs : ws
      ),
    }));
    triggerCelebration('Redid Change', `Re-applied forward parameters for "${nextWs.name}"`, 'info');
  };

  // Fork a calculation record into an independent project workspace
  const handleForkRecordToProject = (record: CalculationRecord) => {
    const newId = `ws-${generateUUID().slice(0, 8)}`;
    const forkedName = `${activeWorkspace.name} [Fork: ${record.moduleId}]`;
    const newWorkspace: CivilWorkspace = {
      ...activeWorkspace,
      id: newId,
      name: forkedName,
      projectCode: `${activeWorkspace.projectCode}-F${Math.floor(Math.random() * 900 + 100)}`,
      activeModule: record.moduleId,
      updatedAt: new Date().toISOString(),
    };
    if (record.inputsSnapshot && Object.keys(record.inputsSnapshot).length > 0) {
      const modKey =
        record.moduleId === 'beam-analysis' ? 'beam' :
        record.moduleId === 'bearing-capacity' ? 'bearing' :
        record.moduleId === 'concrete-mix' ? 'concrete' :
        record.moduleId === 'open-channel' ? 'channel' :
        record.moduleId === 'rebar-bbs' ? 'rebarBbs' :
        record.moduleId === 'boq-estimator' ? 'boq' :
        record.moduleId === 'rate-analysis' ? 'rateAnalysis' :
        record.moduleId === 'masonry-finishes' ? 'masonry' :
        record.moduleId === 'earthwork-alignment' ? 'earthwork' :
        record.moduleId === 'concrete-materials' ? 'concreteMaterials' :
        record.moduleId === 'continuous-beam' ? 'continuousBeam' :
        record.moduleId === 'pile-capacity' ? 'pile' :
        record.moduleId === 'pipe-hydraulics' ? 'pipe' : 'boq';
      (newWorkspace as any)[modKey] = {
        ...(newWorkspace as any)[modKey],
        ...record.inputsSnapshot,
      };
    }
    setAppState((prev) => ({
      ...prev,
      workspaces: [...prev.workspaces, newWorkspace],
      activeWorkspaceId: newId,
    }));
    setIsHistoryDrawerOpen(false);
    setIsDashboardView(false);
    triggerCelebration('Workspace Forked', `Created new independent project "${forkedName}" from calculation snapshot.`, 'celebrate');
  };

  // One-Click Feature Cross-Linking: Rebar BBS -> BOQ Schedule
  const handleTransferBbsToBoq = () => {
    if (!bbsEnvelope.result) return;
    const steelKg = Math.round(bbsEnvelope.result.totalSteelWeightKg);
    updateActiveWorkspace((ws) => {
      const existingIdx = ws.boq.items.findIndex(
        (it) => it.itemNo === '4.01' || it.description.toLowerCase().includes('rebar') || it.description.toLowerCase().includes('reinforcement')
      );
      let updatedItems = [...ws.boq.items];
      if (existingIdx >= 0) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          numberOfMembers: 1,
          lengthM: steelKg,
          widthM: 1,
          heightM: 1,
          unit: 'kg',
          description: '4.01 - Deformed Reinforcement Steel Bars (Grade 60/500W, W = D²/162.2)',
        };
      } else {
        updatedItems.push({
          id: `takeoff-${generateUUID().slice(0, 8)}`,
          itemNo: '4.01',
          description: 'Deformed Reinforcement Steel Bars (Grade 60/500W, W = D²/162.2)',
          category: 'superstructure',
          numberOfMembers: 1,
          lengthM: steelKg,
          widthM: 1,
          heightM: 1,
          deductionQty: 0,
          unit: 'kg',
          wastagePercent: 3.0,
          unitRate: 110,
        });
      }
      return {
        ...ws,
        activeModule: 'boq-estimator',
        boq: { ...ws.boq, items: updatedItems },
      };
    });
    setIsDashboardView(false);
    triggerCelebration(
      'Rebar Takeoff Synced to BOQ',
      `Transferred ${steelKg.toLocaleString()} kg calculated steel bars into BOQ Item 4.01.`,
      'success'
    );
  };

  // One-Click Feature Cross-Linking: Soil Bearing Capacity -> Footing Rebar BBS & Excavation
  const handleTransferBearingToFootingAndPit = () => {
    const b = activeWorkspace.bearing.footingWidthM;
    const df = activeWorkspace.bearing.embedmentDepthM;
    updateActiveWorkspace((ws) => ({
      ...ws,
      rebarBbs: {
        ...ws.rebarBbs,
        footingWidthM: b,
        footingLengthM: b,
      },
      earthwork: {
        ...ws.earthwork,
        pitWidthM: Math.round((b + 0.6) * 10) / 10,
        pitLengthM: Math.round((b + 0.6) * 10) / 10,
        pitDepthM: df,
      },
    }));
    triggerCelebration(
      'Foundation Geometry Linked',
      `Synced Footing (${b}m × ${b}m, depth ${df}m) to Rebar BBS & Pit Excavation.`,
      'success'
    );
  };

  // One-Click Feature Cross-Linking: Soil Bearing Capacity -> Deep Pile Capacity
  const handleTransferBearingToPile = () => {
    const P = activeWorkspace.bearing.appliedColumnLoadKn;
    const phi = activeWorkspace.bearing.frictionAngleDeg;
    const c = activeWorkspace.bearing.soilCohesionKpa;
    const gamma = activeWorkspace.bearing.unitWeightKnPerM3;
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'pile-capacity',
      pile: {
        ...(ws.pile || defaultPile),
        appliedLoadKn: P,
        tipBearingCohesionKpa: c,
        tipBearingFrictionDeg: phi,
        tipBearingUnitWeightKnPerM3: gamma,
      },
    }));
    setIsDashboardView(false);
    triggerCelebration(
      'Geotech Parameters Passed to Pile Module',
      `Transferred Column Load ${P} kN and soil strata parameters to Deep Pile Foundation.`,
      'success'
    );
  };

  // One-Click Feature Cross-Linking: Continuous Beam -> Rebar BBS
  const handleTransferContinuousBeamToRebar = () => {
    if (!continuousBeamEnvelope.result) return;
    const maxM = continuousBeamEnvelope.result.maxSaggingMomentKnm;
    const firstSpan = (activeWorkspace.continuousBeam || defaultContinuousBeam).spans[0];
    const spanL = firstSpan ? firstSpan.lengthM : 6.0;
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'rebar-bbs',
      rebarBbs: {
        ...ws.rebarBbs,
        beamLengthM: spanL,
        beamDepthMm: (ws.continuousBeam || defaultContinuousBeam).sectionDepthMm || 600,
        beamWidthMm: 300,
      },
    }));
    setIsDashboardView(false);
    triggerCelebration(
      'Continuous Beam Linked to Rebar BBS',
      `Transferred design span (${spanL}m, M_max=${maxM.toFixed(1)} kN·m) to Beam Reinforcement BBS.`,
      'success'
    );
  };

  // One-Click Feature Cross-Linking: Pipe Pipeline -> BOQ Plumbing Schedule
  const handleTransferPipeToBoq = () => {
    const pipeData = activeWorkspace.pipe || defaultPipe;
    const lengthM = pipeData.lengthM || 100;
    const diaMm = pipeData.internalDiameterMm || 200;
    const matName = pipeData.pipeMaterial === 'pvc-hdpe' ? 'uPVC Pressure Pipe' : 'Ductile Iron Pipe';
    updateActiveWorkspace((ws) => {
      const existingIdx = ws.boq.items.findIndex(
        (it) => it.itemNo === '6.01' || it.description.toLowerCase().includes('pipe') || it.description.toLowerCase().includes('pipeline')
      );
      let updatedItems = [...ws.boq.items];
      if (existingIdx >= 0) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          numberOfMembers: 1,
          lengthM,
          widthM: 1,
          heightM: 1,
          unit: 'm',
          description: `6.01 - Supply and Laying of ${diaMm}mm Ø ${matName} (Class C)`,
        };
      } else {
        updatedItems.push({
          id: `takeoff-${generateUUID().slice(0, 8)}`,
          itemNo: '6.01',
          description: `Supply and Laying of ${diaMm}mm Ø ${matName} with rubber ring joints`,
          category: 'plumbing',
          numberOfMembers: 1,
          lengthM,
          widthM: 1,
          heightM: 1,
          deductionQty: 0,
          unit: 'm',
          wastagePercent: 3.0,
          unitRate: diaMm >= 250 ? 4200 : 2600,
        });
      }
      return {
        ...ws,
        activeModule: 'boq-estimator',
        boq: { ...ws.boq, items: updatedItems },
      };
    });
    setIsDashboardView(false);
    triggerCelebration(
      'Pipeline Synced to BOQ',
      `Transferred ${lengthM}m of ${diaMm}mm Ø pipe into BOQ Plumbing schedule.`,
      'success'
    );
  };

  // One-Click Feature Cross-Linking: ACI 211 Concrete Mix -> Concrete Materials
  const handleTransferMixToMaterials = () => {
    const batchVol = activeWorkspace.concrete.batchVolumeM3;
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'concrete-materials',
      concreteMaterials: {
        ...ws.concreteMaterials,
        wetVolumeM3: batchVol,
        cementRatio: 1,
        sandRatio: 1.5,
        aggregateRatio: 3.0,
      },
    }));
    setIsDashboardView(false);
    triggerCelebration(
      'Mix Volume Transferred',
      `Pushed ${batchVol} m³ concrete batch into Material Estimator.`,
      'success'
    );
  };

  // One-Click Feature Cross-Linking: Concrete Materials -> BOQ Schedule
  const handleTransferMaterialsToBoq = () => {
    const wetVol = activeWorkspace.concreteMaterials.wetVolumeM3;
    updateActiveWorkspace((ws) => {
      const existingIdx = ws.boq.items.findIndex(
        (it) => it.itemNo === '3.01' || it.description.toLowerCase().includes('rcc') || it.description.toLowerCase().includes('casting')
      );
      let updatedItems = [...ws.boq.items];
      if (existingIdx >= 0) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          numberOfMembers: 1,
          lengthM: wetVol,
          widthM: 1,
          heightM: 1,
          unit: 'm3',
        };
      } else {
        updatedItems.push({
          id: `takeoff-${generateUUID().slice(0, 8)}`,
          itemNo: '3.01',
          description: 'RCC Reinforced Cement Concrete Casting (1:1.5:3 / C25)',
          category: 'superstructure',
          numberOfMembers: 1,
          lengthM: wetVol,
          widthM: 1,
          heightM: 1,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 2.0,
          unitRate: 9800,
        });
      }
      return {
        ...ws,
        activeModule: 'boq-estimator',
        boq: { ...ws.boq, items: updatedItems },
      };
    });
    setIsDashboardView(false);
    triggerCelebration(
      'Concrete Volume Synced',
      `Transferred ${wetVol} m³ concrete to BOQ Schedule.`,
      'success'
    );
  };

  // One-Click Feature Cross-Linking: Earthwork Excavation -> BOQ Substructure
  const handleTransferEarthworkToBoq = () => {
    if (!earthworkEnvelope.result) return;
    const bankVol = Math.round(earthworkEnvelope.result.bankVolumeM3);
    updateActiveWorkspace((ws) => {
      const existingIdx = ws.boq.items.findIndex(
        (it) => it.itemNo === '1.01' || it.description.toLowerCase().includes('earthwork') || it.description.toLowerCase().includes('excavation')
      );
      let updatedItems = [...ws.boq.items];
      if (existingIdx >= 0) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          numberOfMembers: 1,
          lengthM: bankVol,
          widthM: 1,
          heightM: 1,
          unit: 'm3',
        };
      } else {
        updatedItems.push({
          id: `takeoff-${generateUUID().slice(0, 8)}`,
          itemNo: '1.01',
          description: `Earthwork excavation in foundation trenches and pits (${ws.earthwork.soilType})`,
          category: 'substructure',
          numberOfMembers: 1,
          lengthM: bankVol,
          widthM: 1,
          heightM: 1,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 0,
          unitRate: 280,
        });
      }
      return {
        ...ws,
        activeModule: 'boq-estimator',
        boq: { ...ws.boq, items: updatedItems },
      };
    });
    setIsDashboardView(false);
    triggerCelebration(
      'Earthwork Synced to BOQ',
      `Transferred ${bankVol.toLocaleString()} m³ excavation to BOQ.`,
      'success'
    );
  };

  // Comprehensive Global Keyboard Shortcuts:
  // - Ctrl/Cmd + K: Command Palette & Global Search
  // - Ctrl/Cmd + Z: Global Undo
  // - Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Global Redo
  // - Ctrl/Cmd + H: Session History Drawer
  // - Ctrl/Cmd + B: Collapse / Expand Sidebar
  // - "/": Instant Search shortcut (when outside inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleToggleSidebar();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHistoryDrawerOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, activeWorkspace]);

  // Universal Flexible Unit Engine Helper Methods
  const getFieldUnit = (fieldKey: string, category: UnitCategoryKey, fallbackDefault: string): string => {
    const custom = activeWorkspace.unitPreferences?.fieldUnits?.[fieldKey];
    if (custom) return custom;
    const preset = activeWorkspace.unitPreferences?.systemPreset || 'metric';
    const presetKey = preset === 'imperial' || preset === 'regional' ? preset : 'metric';
    return SYSTEM_PRESET_UNITS[presetKey]?.[category] || fallbackDefault;
  };

  const getOutputUnit = (outputKey: string, category: UnitCategoryKey, fallbackDefault: string): string => {
    const custom = activeWorkspace.unitPreferences?.outputUnits?.[outputKey];
    if (custom) return custom;
    const preset = activeWorkspace.unitPreferences?.systemPreset || 'metric';
    const presetKey = preset === 'imperial' || preset === 'regional' ? preset : 'metric';
    return SYSTEM_PRESET_UNITS[presetKey]?.[category] || fallbackDefault;
  };

  const updateFieldUnit = (fieldKey: string, newUnitId: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      unitPreferences: {
        systemPreset: ws.unitPreferences?.systemPreset || 'metric',
        fieldUnits: {
          ...(ws.unitPreferences?.fieldUnits || {}),
          [fieldKey]: newUnitId,
        },
        outputUnits: ws.unitPreferences?.outputUnits || {},
      },
    }));
  };

  const updateOutputUnit = (outputKey: string, newUnitId: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      unitPreferences: {
        systemPreset: ws.unitPreferences?.systemPreset || 'metric',
        fieldUnits: ws.unitPreferences?.fieldUnits || {},
        outputUnits: {
          ...(ws.unitPreferences?.outputUnits || {}),
          [outputKey]: newUnitId,
        },
      },
    }));
  };

  const [isUnitSystemTransitioning, setIsUnitSystemTransitioning] = useState(false);
  const [unitTransitionKey, setUnitTransitionKey] = useState(0);

  const handleSelectUnitPreset = (preset: UnitSystemPreset) => {
    if (preset === (activeWorkspace.unitPreferences?.systemPreset || 'metric')) return;
    setIsUnitSystemTransitioning(true);
    setUnitTransitionKey((prev) => prev + 1);

    updateActiveWorkspace((ws) => ({
      ...ws,
      unitPreferences: {
        systemPreset: preset,
        fieldUnits: {},
        outputUnits: {},
      },
    }));

    const presetLabel = preset === 'metric' ? 'METRIC (SI)' : preset === 'imperial' ? 'IMPERIAL (US)' : 'REGIONAL';
    setToastBanner(`Switched project unit system to ${presetLabel} · Values smoothly converted`);

    setTimeout(() => {
      setIsUnitSystemTransitioning(false);
    }, 380);
  };

  const handleSetModule = (moduleId: EngineeringModuleId) => {
    updateActiveWorkspace((ws) => ({ ...ws, activeModule: moduleId }));
    setIsDashboardView(false);
    setMobileDrawerOpen(false);
  };

  const handleOpenDashboard = () => {
    setIsDashboardView(true);
    setMobileDrawerOpen(false);
    const mainEl = document.getElementById('top');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestoreCalculation = (record: CalculationRecord) => {
    if (record.inputsSnapshot && Object.keys(record.inputsSnapshot).length > 0) {
      updateActiveWorkspace((ws) => {
        const modKey =
          record.moduleId === 'beam-analysis' ? 'beam' :
          record.moduleId === 'bearing-capacity' ? 'bearing' :
          record.moduleId === 'concrete-mix' ? 'concrete' :
          record.moduleId === 'open-channel' ? 'channel' :
          record.moduleId === 'rebar-bbs' ? 'rebarBbs' :
          record.moduleId === 'boq-estimator' ? 'boq' :
          record.moduleId === 'rate-analysis' ? 'rateAnalysis' :
          record.moduleId === 'masonry-finishes' ? 'masonry' :
          record.moduleId === 'earthwork-alignment' ? 'earthwork' :
          record.moduleId === 'concrete-materials' ? 'concreteMaterials' :
          record.moduleId === 'continuous-beam' ? 'continuousBeam' :
          record.moduleId === 'pile-capacity' ? 'pile' :
          record.moduleId === 'pipe-hydraulics' ? 'pipe' : 'boq';
        return {
          ...ws,
          activeModule: record.moduleId,
          [modKey]: {
            ...(ws as any)[modKey],
            ...record.inputsSnapshot,
          },
        };
      });
    } else {
      updateActiveWorkspace((ws) => ({ ...ws, activeModule: record.moduleId }));
    }
    setIsDashboardView(false);
    setToastBanner(`Restored ${record.title}`);
  };

  const handleThemeChange = (pref: ThemePreference) => {
    setAppState((prev) => ({ ...prev, themePreference: pref }));
  };

  const handleToggleSidebar = () => {
    setAppState((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  const handleSelectWorkspace = (id: string) => {
    setAppState((prev) => ({ ...prev, activeWorkspaceId: id }));
    const target = appState.workspaces.find((w) => w.id === id);
    if (target) {
      setToastBanner(`Switched active workspace to "${target.name}"`);
    }
  };

  const handleAddRecentQuery = (query: string) => {
    setAppState((prev) => ({
      ...prev,
      commandRecentQueries: [query, ...prev.commandRecentQueries.filter((q) => q !== query)].slice(0, 10),
    }));
  };

  const handleOpenProfileModal = (tab: 'profile' | 'preferences' | 'presets' = 'profile') => {
    setProfileModalInitialTab(tab);
    setProfilePreferencesModalOpen(true);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setAppState((prev) => ({
      ...prev,
      userProfile: updatedProfile,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === prev.activeWorkspaceId
          ? { ...ws, engineerOfRecord: updatedProfile.fullName, updatedAt: new Date().toISOString() }
          : ws
      ),
    }));
    setToastBanner(`Saved credentials for ${updatedProfile.fullName}. Reports updated.`);
  };

  const handleSavePreferences = (updatedPrefs: UserCustomPreferences) => {
    setAppState((prev) => ({
      ...prev,
      userPreferences: updatedPrefs,
    }));
    setToastBanner('Custom calculation preferences saved.');
  };

  const handleApplyPreferencesToWorkspace = () => {
    const prefs = userPreferences;
    updateActiveWorkspace((ws) => ({
      ...ws,
      currency: prefs.defaultCurrency,
      governingCode: prefs.defaultBuildingCode,
      concreteMaterials: {
        ...ws.concreteMaterials,
        cementBagWeightKg: prefs.defaultCementBagWeightKg,
        wastagePercent: prefs.wastage.concretePercent,
      },
      rebarBbs: {
        ...ws.rebarBbs,
        wastagePercent: prefs.wastage.rebarPercent,
      },
      masonry: {
        ...ws.masonry,
        mortarWastagePercent: prefs.wastage.brickMortarPercent,
      },
      earthwork: {
        ...ws.earthwork,
        customShrinkagePercent: prefs.wastage.earthworkShrinkagePercent,
      },
      unitPreferences: {
        systemPreset: prefs.preferredUnitSystem,
        fieldUnits: ws.unitPreferences?.fieldUnits || {},
        outputUnits: ws.unitPreferences?.outputUnits || {},
      },
    }));
    setToastBanner('Applied global engineering defaults & wastage rules to active workspace.');
  };

  const handleSavePreset = (newPreset: EngineeringPreset) => {
    setAppState((prev) => {
      const existingIdx = (prev.presets || []).findIndex((p) => p.id === newPreset.id);
      let updatedPresets: EngineeringPreset[];
      if (existingIdx >= 0) {
        updatedPresets = (prev.presets || []).map((p, idx) => (idx === existingIdx ? newPreset : p));
      } else {
        updatedPresets = [newPreset, ...(prev.presets || [])];
      }
      return { ...prev, presets: updatedPresets };
    });
    setToastBanner(`Saved engineering preset "${newPreset.name}".`);
  };

  const handleDeletePreset = (presetId: string) => {
    setAppState((prev) => ({
      ...prev,
      presets: (prev.presets || []).filter((p) => p.id !== presetId),
    }));
    setToastBanner('Deleted custom preset.');
  };

  const handleApplyPreset = (preset: EngineeringPreset) => {
    const { payload } = preset;
    updateActiveWorkspace((ws) => {
      const nextWs: CivilWorkspace = { ...ws };
      if (payload.targetModule) {
        nextWs.activeModule = payload.targetModule;
      }
      if (payload.concreteMaterials) {
        nextWs.concreteMaterials = { ...nextWs.concreteMaterials, ...payload.concreteMaterials };
      }
      if (payload.concreteMix) {
        nextWs.concrete = { ...nextWs.concrete, ...payload.concreteMix };
      }
      if (payload.rateAnalysis) {
        nextWs.rateAnalysis = { ...nextWs.rateAnalysis, ...payload.rateAnalysis };
      }
      if (payload.beam) {
        nextWs.beam = { ...nextWs.beam, ...payload.beam };
      }
      if (payload.bearing) {
        nextWs.bearing = { ...nextWs.bearing, ...payload.bearing };
      }
      if (payload.channel) {
        nextWs.channel = { ...nextWs.channel, ...payload.channel };
      }
      if (payload.earthwork) {
        nextWs.earthwork = { ...nextWs.earthwork, ...payload.earthwork };
      }
      if (payload.masonry) {
        nextWs.masonry = { ...nextWs.masonry, ...payload.masonry };
      }
      if (payload.rebarBbs) {
        nextWs.rebarBbs = { ...nextWs.rebarBbs, ...payload.rebarBbs };
      }
      if (payload.boq) {
        nextWs.boq = { ...nextWs.boq, ...payload.boq };
      }
      return nextWs;
    });
    setToastBanner(`Applied preset "${preset.name}" to current workspace.`);
  };

  const handleImportPresets = (imported: EngineeringPreset[]) => {
    setAppState((prev) => {
      const existing = prev.presets || [];
      const merged = [...imported, ...existing.filter((e) => !imported.some((i) => i.id === e.id))];
      return { ...prev, presets: merged };
    });
    setToastBanner(`Imported ${imported.length} engineering presets.`);
  };

  const handleResetFactoryPresets = () => {
    setAppState((prev) => ({
      ...prev,
      presets: createDefaultEngineeringPresets(),
    }));
    setToastBanner('Reset to factory engineering presets.');
  };

  // Custom Unit Handlers
  const handleCreateCustomUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitSymbol.trim() || newUnitFactor <= 0) return;

    const newUnit: CustomUnitDefinition = {
      id: `custom_${generateUUID().slice(0, 8)}`,
      name: newUnitName.trim(),
      symbol: newUnitSymbol.trim(),
      category: newUnitCategory,
      toBaseFactor: newUnitFactor,
      description: newUnitDesc.trim() || 'Custom jobsite measurement unit',
    };

    setAppState((prev) => ({
      ...prev,
      customUnits: [newUnit, ...prev.customUnits],
    }));

    setNewUnitName('');
    setNewUnitSymbol('');
    setNewUnitFactor(1.0);
    setNewUnitDesc('');
    setCustomUnitModalOpen(false);
    setToastBanner(`Created custom engineering unit: ${newUnit.name} (${newUnit.symbol})`);
  };

  const handleDeleteCustomUnit = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      customUnits: prev.customUnits.filter((u) => u.id !== id),
    }));
  };

  // BOQ Item Form Handlers
  const handleSaveTakeoffItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDesc.trim()) return;

    if (editingTakeoffItemId) {
      // Update existing item
      updateActiveWorkspace((ws) => ({
        ...ws,
        boq: {
          ...ws.boq,
          items: ws.boq.items.map((it) =>
            it.id === editingTakeoffItemId
              ? {
                  ...it,
                  itemNo: itemNo.trim() || it.itemNo,
                  description: itemDesc.trim(),
                  category: itemCategory,
                  numberOfMembers: Math.max(1, itemMembers),
                  lengthM: itemLength,
                  widthM: itemWidth,
                  heightM: itemHeight,
                  deductionQty: itemDeduction,
                  unit: itemUnit,
                  wastagePercent: itemWastage,
                  unitRate: itemUnitRate,
                }
              : it
          ),
        },
      }));
      triggerCelebration('Takeoff Item Updated', `Updated line item: ${itemDesc.trim()}`, 'success');
    } else {
      // Add new item
      const newItem: TakeoffLineItem = {
        id: `takeoff-${generateUUID().slice(0, 8)}`,
        itemNo: itemNo.trim() || `${activeWorkspace.boq.items.length + 1}.01`,
        description: itemDesc.trim(),
        category: itemCategory,
        numberOfMembers: Math.max(1, itemMembers),
        lengthM: itemLength,
        widthM: itemWidth,
        heightM: itemHeight,
        deductionQty: itemDeduction,
        unit: itemUnit,
        wastagePercent: itemWastage,
        unitRate: itemUnitRate,
      };

      updateActiveWorkspace((ws) => ({
        ...ws,
        boq: {
          ...ws.boq,
          items: [...ws.boq.items, newItem],
        },
      }));
      triggerCelebration('BOQ Line Item Saved', `Added #${newItem.itemNo} to takeoff schedule.`, 'success');
    }

    // Reset Form
    setEditingTakeoffItemId(null);
    setItemNo('');
    setItemDesc('');
    setItemMembers(1);
    setItemLength(0);
    setItemWidth(0);
    setItemHeight(0);
    setItemDeduction(0);
    setItemWastage(3.0);
    setItemUnitRate(0);
  };

  const handleEditTakeoffItem = (item: TakeoffLineItem) => {
    setEditingTakeoffItemId(item.id);
    setItemNo(item.itemNo);
    setItemDesc(item.description);
    setItemCategory(item.category);
    setItemMembers(item.numberOfMembers);
    setItemLength(item.lengthM);
    setItemWidth(item.widthM);
    setItemHeight(item.heightM);
    setItemDeduction(item.deductionQty);
    setItemUnit(item.unit);
    setItemWastage(item.wastagePercent);
    setItemUnitRate(item.unitRate);
  };

  const handleDuplicateTakeoffItem = (item: TakeoffLineItem) => {
    const copy: TakeoffLineItem = {
      ...item,
      id: `takeoff-${generateUUID().slice(0, 8)}`,
      itemNo: `${item.itemNo}-copy`,
      description: `${item.description} (Copy)`,
    };
    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: [...ws.boq.items, copy],
      },
    }));
    setToastBanner(`Duplicated item #${item.itemNo}`);
  };

  const handleDeleteTakeoffItem = (id: string) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: ws.boq.items.filter((it) => it.id !== id),
      },
    }));
    setToastBanner('Deleted takeoff item');
  };

  const handleLoadSampleBOQItems = () => {
    const sampleItems = createSampleBOQItems();
    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: [...ws.boq.items, ...sampleItems],
      },
    }));
    setToastBanner(`Loaded ${sampleItems.length} engineering takeoff items into project.`);
  };

  const handleClearAllBOQItems = () => {
    if (window.confirm(`Clear all ${activeWorkspace.boq.items.length} takeoff items from "${activeWorkspace.name}"?`)) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        boq: {
          ...ws.boq,
          items: [],
        },
      }));
      setToastBanner('Cleared all takeoff items from project.');
    }
  };

  // Apply Calculated Unit Rate from Rate Analysis to BOQ
  const handleApplyRateToBOQ = () => {
    if (!rateAnalysisEnvelope.result) return;
    const rateRes = rateAnalysisEnvelope.result;
    // Check if an existing line matches workType
    const existingIndex = activeWorkspace.boq.items.findIndex((it) =>
      it.description.toLowerCase().includes(rateRes.workType.toLowerCase()) ||
      it.description.toLowerCase().includes('rcc')
    );

    const existingItem = existingIndex >= 0 ? activeWorkspace.boq.items[existingIndex] : null;
    const calculatedRate = existingItem?.unit === 'cft' ? rateRes.unitRatePerCft : rateRes.unitRatePerM3;
    const unitLabel = existingItem?.unit === 'cft' ? 'cft' : 'm³';

    if (existingIndex >= 0) {
      updateActiveWorkspace((ws) => ({
        ...ws,
        boq: {
          ...ws.boq,
          items: ws.boq.items.map((it, idx) =>
            idx === existingIndex
              ? { ...it, unitRate: calculatedRate }
              : it
          ),
        },
      }));
      setToastBanner(`Updated existing item rate with ${rateRes.currencySymbol} ${calculatedRate.toFixed(2)}/${unitLabel}`);
    } else {
      const newItem: TakeoffLineItem = {
        id: `takeoff-${generateUUID().slice(0, 8)}`,
        itemNo: `${activeWorkspace.boq.items.length + 1}.01`,
        description: rateRes.workDescription,
        category: rateRes.workType.includes('brick') ? 'masonry' : 'superstructure',
        numberOfMembers: 1,
        lengthM: 10.0,
        widthM: 0.5,
        heightM: 0.5,
        deductionQty: 0,
        unit: 'm3',
        wastagePercent: 2.5,
        unitRate: calculatedRate,
      };
      updateActiveWorkspace((ws) => ({
        ...ws,
        boq: {
          ...ws.boq,
          items: [...ws.boq.items, newItem],
        },
      }));
      setToastBanner(`Added Rate Analysis item to BOQ sheet (${rateRes.currencySymbol} ${calculatedRate.toFixed(2)}/m³)`);
    }
  };

  // Export BOQ Takeoff as CSV Spreadsheet
  const handleExportBOQCSV = () => {
    if (!boqEnvelope.result) return;
    const res = boqEnvelope.result;
    const headers = [
      'Item No',
      'Description',
      'Category',
      'Nos (Count)',
      'Length (m)',
      'Width (m)',
      'Height (m)',
      'Deduction',
      'Unit',
      'Gross Qty',
      'Net Qty',
      'Wastage (%)',
      'Billable Qty',
      `Unit Rate (${res.currency})`,
      `Total Amount (${res.currency})`,
    ];

    const rows = res.items.map((it) => [
      `"${it.itemNo}"`,
      `"${it.description.replace(/"/g, '""')}"`,
      `"${it.category}"`,
      it.numberOfMembers,
      it.lengthM,
      it.widthM,
      it.heightM,
      it.deductionQty,
      `"${it.unit}"`,
      it.grossQty,
      it.netQty,
      it.wastagePercent,
      it.totalBillableQty,
      it.unitRate,
      it.itemTotalAmount,
    ]);

    // Footer summary
    rows.push([]);
    rows.push(['Subtotal Amount', '', '', '', '', '', '', '', '', '', '', '', '', '', res.subtotalAmount]);
    rows.push([`Contingency (${res.contingencyPercent}%)`, '', '', '', '', '', '', '', '', '', '', '', '', '', res.contingencyAmount]);
    rows.push([`Contractor Profit & Overhead (${res.contractorOverheadPercent}%)`, '', '', '', '', '', '', '', '', '', '', '', '', '', res.contractorOverheadAmount]);
    rows.push([`VAT / Tax (${res.vatTaxPercent}%)`, '', '', '', '', '', '', '', '', '', '', '', '', '', res.vatTaxAmount]);
    rows.push([`GRAND TOTAL BOQ (${res.currency})`, '', '', '', '', '', '', '', '', '', '', '', '', '', res.grandTotalAmount]);

    const brandComments = [
      '# PB CivilLab — Quantity Takeoff & BOQ Schedule',
      '# CALCULATE SMARTER. BUILD BETTER.',
      '# Developed & Designed by PROKASH BISWAS',
      `# Project: ${activeWorkspace.name} [${activeWorkspace.projectCode}]`,
      `# Site: ${activeWorkspace.siteLocation} | EOR: ${activeWorkspace.engineerOfRecord}`,
      `# Export Timestamp: ${new Date().toISOString()}`,
      '',
    ].join('\n');

    const csvContent = brandComments + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `takeoff-boq-${activeWorkspace.projectCode}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastBanner('Exported Takeoff & BOQ CSV spreadsheet');
  };

  // Copy analytical calculation summary
  const handleCopyAnalyticalSummary = () => {
    if (!currentEnvelope.result) return;
    const modLabel = MODULE_META[activeModule].label;
    const code = MODULE_META[activeModule].codeStandard;
    let text = `========================================================\nPB CivilLab — Analytical Calculation Summary\nProject: ${activeWorkspace.name} [${activeWorkspace.projectCode}]\nModule: ${modLabel}\nGoverning Standard: ${code}\nStatus: ${currentEnvelope.status.toUpperCase()}\nTimestamp: ${new Date().toLocaleString()}\n========================================================\n`;

    if (activeModule === 'beam-analysis') {
      const r = currentEnvelope.result as BeamAnalysisResult;
      text += `Span: ${activeWorkspace.beam.spanLengthM} m | UDL: ${activeWorkspace.beam.uniformLoadKnPerM} kN/m | Point Load: ${activeWorkspace.beam.pointLoadKn} kN\n`;
      text += `Max Moment M_max: ${r.maxMomentKnm.toFixed(2)} kN·m (${(r.maxMomentKnm * 1000).toFixed(0)} N·m)\n`;
      text += `Max Shear V_max: ${r.maxShearKn.toFixed(2)} kN (${(r.maxShearKn * 1000).toFixed(0)} N)\n`;
      text += `Max Deflection: ${r.maxDeflectionMm.toFixed(3)} mm (Allowable: ${r.allowableDeflectionMm.toFixed(2)} mm)\n`;
      text += `Bending Stress: ${r.bendingStressMpa.toFixed(2)} MPa (Limit: ${activeWorkspace.beam.allowableStressMpa} MPa)\n`;
      text += `Demand/Capacity Ratio: ${(r.utilizationRatio * 100).toFixed(1)}%\n`;
    } else if (activeModule === 'bearing-capacity') {
      const r = currentEnvelope.result as BearingAnalysisResult;
      text += `Footing B: ${activeWorkspace.bearing.footingWidthM} m | Df: ${activeWorkspace.bearing.embedmentDepthM} m | Column P: ${activeWorkspace.bearing.appliedColumnLoadKn} kN\n`;
      text += `Ultimate Capacity q_ult: ${r.ultimateBearingKpa.toFixed(1)} kPa\n`;
      text += `Allowable Capacity q_all: ${r.allowableBearingKpa.toFixed(1)} kPa\n`;
      text += `Applied Pressure q_app: ${r.appliedPressureKpa.toFixed(1)} kPa\n`;
      text += `Effective Safety Factor: ${r.effectiveSafetyFactor.toFixed(2)} (Target FS = ${activeWorkspace.bearing.factorOfSafety})\n`;
    } else if (activeModule === 'open-channel') {
      const r = currentEnvelope.result as ChannelHydraulicsResult;
      text += `Width b: ${activeWorkspace.channel.bottomWidthM} m | Depth y: ${activeWorkspace.channel.flowDepthM} m | Bed Slope: ${activeWorkspace.channel.bedSlope}\n`;
      text += `Discharge Q: ${r.dischargeM3ps.toFixed(3)} m³/s (cumecs)\n`;
      text += `Mean Velocity V: ${r.velocityMps.toFixed(3)} m/s (${(r.velocityMps * 3.6).toFixed(2)} km/h)\n`;
      text += `Flow Area: ${r.flowAreaM2.toFixed(3)} m² | Wetted Perimeter: ${r.wettedPerimeterM.toFixed(3)} m\n`;
      text += `Froude Number Fr: ${r.froudeNumber.toFixed(3)} (${r.flowRegime})\n`;
    } else {
      text += `Analytical Envelope converges nominal design requirements.\n`;
    }
    text += `========================================================\n`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setToastBanner('Copied analytical calculation summary to clipboard');
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Export Analytical Schedule CSV
  const handleExportAnalyticalCsv = () => {
    if (!currentEnvelope.result) {
      setToastBanner('No active analytical calculation result to export.');
      return;
    }
    exportAnalyticalScheduleCsv(activeModule, activeWorkspace, currentEnvelope, userProfile);
    setToastBanner(`Exported ${MODULE_META[activeModule].shortLabel} Schedule to CSV`);
  };

  // Helper to construct and inject printable A4 submittal report with verified QR code into pb-printable-report
  const renderQuickPrintSheetToEl = async (printEl: HTMLElement) => {
    const previewEl = document.getElementById('pb-report-preview-sheet');
    if (previewEl) {
      printEl.innerHTML = previewEl.innerHTML;
      printEl.className = 'print:block bg-white text-slate-900 p-8 font-sans m-0 leading-relaxed';
      return;
    }

    const meta = MODULE_META[activeModule];
    const eqInfo = getGoverningEquations(activeModule);
    const capInfo = getCapacityUtilization(activeModule, activeWorkspace, currentEnvelope);
    const nowStr = new Date().toLocaleString();

    // Generate Scannable QR Code containing document reference & project metadata
    const qrResult = activeReportQr || await generateReportQrCode({
      projectCode: activeWorkspace.projectCode,
      projectName: activeWorkspace.name,
      moduleId: activeModule,
      moduleName: meta.label,
      codeStandard: meta.codeStandard,
      siteLocation: activeWorkspace.siteLocation,
      engineerOfRecord: userProfile.fullName || activeWorkspace.engineerOfRecord,
      organization: userProfile.organization,
      licenseNumber: userProfile.licenseNumber,
      status: currentEnvelope.status,
    });
    const docId = qrResult.documentId;

    const tableEl = document.querySelector('.analytical-dense-table-container');
    const diagramEl = document.querySelector('.analytical-diagram-container');

    printEl.innerHTML = `
      <div class="space-y-6 font-sans text-slate-900 bg-white p-6 max-w-5xl mx-auto leading-relaxed">
        <!-- Certified Executive Header with Dynamic Verification QR Code -->
        <div class="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4 print-avoid-break">
          <div class="flex items-center gap-3.5">
            <img src="${BRAND_LOGO_SRC}" alt="PB CivilLab Official Brand Logo" class="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-xs shrink-0" />
            <div>
              <div class="text-2xl font-black font-sans tracking-tight text-blue-700">PB CivilLab</div>
              <div class="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-600 mt-0.5">
                CALCULATE SMARTER. BUILD BETTER. · DEVELOPED BY PROKASH BISWAS
              </div>
              <div class="text-xs font-mono text-slate-500 mt-1">Official Engineering Submittal &amp; Verification Sheet</div>
            </div>
          </div>
          <div class="flex items-center gap-3.5 shrink-0">
            <div class="text-right text-xs font-mono space-y-0.5">
              <div class="font-bold text-sm uppercase text-slate-900">${meta.label}</div>
              <div>Doc Ref: <strong>${docId}</strong></div>
              <div>Governing Standard: <strong class="text-blue-700">${meta.codeStandard}</strong></div>
              <div>Timestamp: ${nowStr}</div>
              <div class="text-[9.5px] text-slate-500 font-semibold mt-0.5">Hash: <code>${qrResult.verificationHash}</code></div>
            </div>
            <!-- Injected Dynamic Scannable Verification QR Code -->
            <div class="flex flex-col items-center border-2 border-slate-900 rounded-lg p-1 bg-white shadow-2xs">
              <img src="${qrResult.dataUrl}" alt="Document Verification QR Code [${docId}]" class="w-20 h-20" />
              <span class="text-[7.5px] font-mono font-bold text-slate-700 mt-0.5 tracking-tight">SCAN TO VERIFY</span>
              <span class="text-[6.5px] font-mono text-slate-500">${docId}</span>
            </div>
          </div>
        </div>

        <!-- Project Identification & Engineer Credentials -->
        <div class="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-300 rounded print-avoid-break text-xs font-mono">
          <div>
            <div class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Project Identification</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${activeWorkspace.name} [${activeWorkspace.projectCode}]</div>
            <div class="text-slate-600 mt-0.5">Location: ${activeWorkspace.siteLocation} · Currency: ${activeWorkspace.currency}</div>
          </div>
          <div class="text-right">
            <div class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Certified Prepared By</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${userProfile.fullName || 'Project Engineer, PE'}</div>
            <div class="text-slate-600 mt-0.5">${userProfile.designation} · ${userProfile.organization}</div>
            <div class="text-[11px] text-slate-500">License ID: <strong>${userProfile.licenseNumber || 'PE-00000'}</strong></div>
          </div>
        </div>

        <!-- Primary Capacity & Limit State Banner -->
        <div class="p-3 bg-slate-100 border border-slate-300 rounded flex items-center justify-between text-xs font-mono print-avoid-break">
          <div>
            <span class="text-[9px] uppercase font-bold text-slate-500">Compliance &amp; Capacity Check:</span>
            <span class="ml-2 font-bold ${currentEnvelope.status === 'valid' ? 'text-emerald-700' : currentEnvelope.status === 'warning' ? 'text-amber-700' : 'text-rose-700'}">
              ● ${currentEnvelope.status === 'valid' ? 'VERIFIED & CONFORMANT' : currentEnvelope.status === 'warning' ? 'CHECK LIMIT STATE ADVISORY' : 'CRITICAL CAPACITY EXCEEDED'}
            </span>
          </div>
          ${capInfo ? `<div><strong>${capInfo.metricLabel}:</strong> <span class="font-bold">${capInfo.formattedValue}</span></div>` : ''}
        </div>

        <!-- Analytical Calculation Schedule Table -->
        <div class="space-y-2">
          <div class="font-bold font-mono text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
            Analytical Calculation Schedule &amp; Numerical Convergence (${meta.shortLabel})
          </div>
          ${tableEl ? `<div class="a4-table-render">${tableEl.innerHTML}</div>` : ''}
          ${!tableEl && diagramEl ? `<div class="a4-diagram-render py-2">${diagramEl.innerHTML}</div>` : ''}
        </div>

        <!-- Governing Code Equations & Formulations -->
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono space-y-2 print-avoid-break">
          <div class="font-bold uppercase text-slate-800 tracking-wider border-b border-slate-200 pb-1">
            Governing Standards &amp; Formulations (${eqInfo.codeStandard})
          </div>
          <div class="space-y-1.5 text-slate-700">
            ${eqInfo.equations.map(eq => `<div><strong>${eq.name}:</strong> <code class="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-blue-900">${eq.formula}</code></div>`).join('')}
          </div>
        </div>

        <!-- 3-Tier Quality Sign-Off Matrix -->
        <div class="pt-4 border-t-2 border-slate-800 space-y-2 print-avoid-break text-xs font-mono">
          <div class="flex items-center justify-between text-[10px] bg-slate-50 border border-slate-200 px-3 py-1 rounded">
            <span class="font-bold text-blue-900 uppercase">Quality Assurance (QA/QC) &amp; Code Compliance 3-Tier Sign-Off Matrix</span>
            <span class="text-slate-500">ISO 9001 Compliance Protocol · BNBC / ACI / IS</span>
          </div>
          <div class="grid grid-cols-3 gap-3 border border-slate-300 rounded p-2.5 bg-white">
            <div class="space-y-1 pr-2">
              <div class="text-[9.5px] font-bold uppercase text-blue-800">1. Prepared By (Design)</div>
              <div class="font-bold text-slate-900">${userProfile.fullName || 'Project Engineer, EIT/PE'}</div>
              <div class="text-slate-500 text-[10px]">${userProfile.designation} · ${userProfile.organization}</div>
              <div class="pt-2">
                <div class="w-full border-b border-slate-400 mb-1"></div>
                <div class="text-[9px] text-slate-500">Sign: ______________ Date: ${new Date().toLocaleDateString()}</div>
                <div class="text-[9px] text-slate-600 font-semibold">${userProfile.licenseNumber ? `Lic: ${userProfile.licenseNumber}` : 'Lic: EIT/PE-49120'}</div>
              </div>
            </div>

            <div class="space-y-1 px-2 border-l border-slate-200">
              <div class="text-[9.5px] font-bold uppercase text-blue-800">2. Checked By (QA / Peer Review)</div>
              <div class="font-bold text-slate-900">Senior Structural QA Reviewer, PE/SE</div>
              <div class="text-slate-500 text-[10px]">Lead QA/QC Structural Peer Reviewer</div>
              <div class="pt-2">
                <div class="w-full border-b border-slate-400 mb-1"></div>
                <div class="text-[9px] text-slate-500">Sign: ______________ Date: ${new Date().toLocaleDateString()}</div>
                <div class="text-[9px] text-slate-600 font-semibold">Lic: SE/PE-82941 (QA Verified)</div>
              </div>
            </div>

            <div class="space-y-1 pl-2 border-l border-slate-200">
              <div class="text-[9.5px] font-bold uppercase text-blue-800">3. Approved By (EOR)</div>
              <div class="font-bold text-slate-900">${activeWorkspace.engineerOfRecord || userProfile.fullName || 'Principal Engineer of Record, PE'}</div>
              <div class="text-slate-500 text-[10px]">Engineer of Record (EOR) / Principal</div>
              <div class="pt-2">
                <div class="w-full border-b-2 border-slate-800 mb-1"></div>
                <div class="text-[9px] text-slate-500">Seal &amp; Sign: _________ Date: ${new Date().toLocaleDateString()}</div>
                <div class="text-[9px] text-slate-900 font-bold">${userProfile.licenseNumber ? `EOR Lic: ${userProfile.licenseNumber}` : 'Official Registered PE Stamp'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Verification Ledger -->
        <div class="pt-3 border-t border-slate-300 text-[10px] font-mono text-slate-500 flex justify-between items-center print-avoid-break">
          <div>© 2026 PB CivilLab · Developed &amp; Designed by PROKASH BISWAS</div>
          <div class="flex items-center gap-2">
            <span>Doc Ref: <strong>${docId}</strong></span>
            <span>·</span>
            <span class="text-blue-700 font-bold">${qrResult.verificationHash}</span>
            <span>·</span>
            <span>Digitally Verified</span>
          </div>
        </div>
      </div>
    `;
    printEl.className = 'print:block bg-white text-slate-900 p-6 font-sans m-0 leading-relaxed';
  };

  // Instant Quick Print A4 Execution with Injected Verification QR Code
  const handleQuickPrintA4Report = async () => {
    const printEl = document.getElementById('pb-printable-report');
    if (!printEl) return;
    setToastBanner('Injecting verification QR code into certified A4 report...');
    await renderQuickPrintSheetToEl(printEl);
    document.body.classList.add('is-printing-report');

    const cleanUp = () => {
      if (printEl) {
        printEl.innerHTML = '';
        printEl.className = 'hidden print:block bg-white text-slate-900';
      }
      document.body.classList.remove('is-printing-report');
      window.removeEventListener('afterprint', cleanUp);
    };
    window.addEventListener('afterprint', cleanUp);
    setTimeout(() => {
      window.print();
    }, 50);
  };

  // Direct Client-Side PDF Generation & Download (jsPDF) with Multi-Stage Progress Tracking
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<PdfExportProgress | null>(null);

  const handleDirectDownloadPdf = async () => {
    if (!currentEnvelope || !currentEnvelope.result) {
      setToastBanner('Cannot export PDF: No calculation result is available for this module.');
      return;
    }
    try {
      setIsExportingPdf(true);
      setPdfExportProgress({
        percent: 10,
        stage: 'Initializing certified A4 submittal canvas & geometry...',
      });
      setToastBanner('Starting certified A4 engineering PDF generation (10%)...');

      await exportCertifiedEngineeringPdf({
        workspace: activeWorkspace,
        activeModule,
        envelope: currentEnvelope,
        userProfile,
        onProgress: (progress) => {
          setPdfExportProgress(progress);
          setToastBanner(`Exporting PDF: ${progress.percent}% · ${progress.stage}`);
        },
      });

      // Brief completion stage to show 100% completion before dismissal
      setPdfExportProgress({
        percent: 100,
        stage: 'Certified submittal compiled & download triggered!',
      });
      await new Promise((resolve) => setTimeout(resolve, 450));

      triggerCelebration(
        'Certified Engineering PDF Exported',
        `Generated cryptographically verified submittal for ${MODULE_META[activeModule].shortLabel} (100% complete).`,
        'celebrate'
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      triggerCelebration('PDF Export Failed', errMsg, 'warning');
      setToastBanner(`PDF Export error: ${errMsg}`);
    } finally {
      setIsExportingPdf(false);
      setPdfExportProgress(null);
    }
  };

  // Cross-Module Auto-Sync: Rebar BBS & Concrete Mix -> BOQ Takeoff Schedule
  const handleSyncAllModulesToBoq = () => {
    const res = syncAllModulesToBoq(activeWorkspace, bbsEnvelope, concreteEnvelope);
    if (res.syncedItemsCount > 0) {
      updateActiveWorkspace(() => res.updatedWorkspace);
      setToastBanner(res.message);
    } else {
      setToastBanner(res.message);
    }
  };

  // Synchronize pristine vector print state whenever browser print (Ctrl+P) is invoked
  useEffect(() => {
    let isCancelled = false;
    generateReportQrCode({
      projectCode: activeWorkspace.projectCode,
      projectName: activeWorkspace.name,
      moduleId: activeModule,
      moduleName: MODULE_META[activeModule].label,
      codeStandard: MODULE_META[activeModule].codeStandard,
      siteLocation: activeWorkspace.siteLocation,
      engineerOfRecord: userProfile.fullName || activeWorkspace.engineerOfRecord,
      organization: userProfile.organization,
      licenseNumber: userProfile.licenseNumber,
      status: currentEnvelope.status,
    }).then((res) => {
      if (!isCancelled) {
        setActiveReportQr(res);
      }
    }).catch((err) => {
      console.warn('Failed to pre-generate QR code for report:', err);
    });

    const handleBeforePrint = async () => {
      const printEl = document.getElementById('pb-printable-report');
      if (printEl && (!printEl.innerHTML || !printEl.innerHTML.trim())) {
        await renderQuickPrintSheetToEl(printEl);
      }
    };
    const handleAfterPrint = () => {
      const printEl = document.getElementById('pb-printable-report');
      if (printEl) {
        printEl.innerHTML = '';
        printEl.className = 'hidden print:block bg-white text-slate-900';
      }
      document.body.classList.remove('is-printing-report');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      isCancelled = true;
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [activeModule, activeWorkspace, currentEnvelope, userProfile]);

  // Log calculation record
  const handleLogCalculationSnapshot = () => {
    if (currentEnvelope.status === 'invalid') {
      setToastBanner('Cannot log calculation with active validation errors. Please rectify inputs.');
      return;
    }

    const newId = generateUUID();
    const now = new Date().toISOString();
    let newRecord: CalculationRecord;

    if (activeModule === 'boq-estimator' && boqEnvelope.result) {
      const res = boqEnvelope.result;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'boq-estimator',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · BOQ Estimate (${res.totalItemCount} Items)`,
        notes: `Base ${res.currencySymbol}${res.subtotalAmount.toLocaleString()} · Grand Total ${res.currencySymbol}${res.grandTotalAmount.toLocaleString()} (${res.currency})`,
        status: 'nominal',
        keyMetrics: [
          { label: 'Grand Total', value: `${res.currencySymbol} ${res.grandTotalAmount.toLocaleString()}`, unit: res.currency },
          { label: 'Base Subtotal', value: `${res.currencySymbol} ${res.subtotalAmount.toLocaleString()}`, unit: res.currency },
          { label: 'CP&OH Margin', value: `${res.currencySymbol} ${res.contractorOverheadAmount.toLocaleString()}`, unit: res.currency },
        ],
        inputsSnapshot: { ...activeWorkspace.boq },
      };
    } else if (activeModule === 'rate-analysis' && rateAnalysisEnvelope.result) {
      const res = rateAnalysisEnvelope.result;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'rate-analysis',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Rate Analysis (${res.workType.toUpperCase()})`,
        notes: `Composite Unit Rate: ${res.currencySymbol}${res.unitRatePerM3.toFixed(2)}/m³ (${res.currencySymbol}${res.unitRatePerCft.toFixed(2)}/cft)`,
        status: 'nominal',
        keyMetrics: [
          { label: 'Rate per m³', value: `${res.currencySymbol} ${res.unitRatePerM3.toFixed(2)}`, unit: '/m³' },
          { label: 'Rate per CFT', value: `${res.currencySymbol} ${res.unitRatePerCft.toFixed(2)}`, unit: '/cft' },
          { label: 'Prime Cost', value: `${res.currencySymbol} ${res.primeCost.toLocaleString()}`, unit: res.currency },
        ],
        inputsSnapshot: { ...activeWorkspace.rateAnalysis },
      };
    } else if (activeModule === 'unit-converter') {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'unit-converter',
        timestamp: now,
        title: `Unit Conversion: ${activeWorkspace.converter.inputValue} ${activeWorkspace.converter.fromUnit} ⇄ ${activeWorkspace.converter.toUnit}`,
        notes: `${activeWorkspace.converter.category.toUpperCase()} · ${activeConversionResult.formula}`,
        status: 'nominal',
        keyMetrics: [
          { label: 'Input', value: `${activeWorkspace.converter.inputValue}`, unit: activeWorkspace.converter.fromUnit },
          { label: 'Converted', value: `${Number(activeConversionResult.result.toFixed(4))}`, unit: activeWorkspace.converter.toUnit },
          { label: 'Feet-Inch', value: activeFeetInchResult.fractionString || 'N/A', unit: 'arch' },
        ],
        inputsSnapshot: { ...activeWorkspace.converter },
      };
    } else if (activeModule === 'concrete-materials' && matEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'concrete-materials',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Material Mix (${activeWorkspace.concreteMaterials.code})`,
        notes: `Wet ${activeWorkspace.concreteMaterials.wetVolumeM3}m³ · Ratio 1:${activeWorkspace.concreteMaterials.ratioSand}:${activeWorkspace.concreteMaterials.ratioAggregate} · Dry Factor ${matEnvelope.result.dryVolumeFactor}`,
        status: matEnvelope.result.status,
        keyMetrics: [
          { label: 'Cement Bags', value: matEnvelope.result.cementBags50Kg.toFixed(1), unit: 'bags' },
          { label: 'Sand Volume', value: matEnvelope.result.sandCft.toFixed(1), unit: 'cft' },
          { label: 'Agg Volume', value: matEnvelope.result.aggregateCft.toFixed(1), unit: 'cft' },
        ],
        inputsSnapshot: { ...activeWorkspace.concreteMaterials },
      };
    } else if (activeModule === 'rebar-bbs' && bbsEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'rebar-bbs',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Rebar BBS (${activeWorkspace.rebarBbs.elementType})`,
        notes: `Total cut length ${bbsEnvelope.result.totalBarsLengthM}m · Mass ${bbsEnvelope.result.totalSteelWeightKg} kg`,
        status: bbsEnvelope.result.status,
        keyMetrics: [
          { label: 'Steel Weight', value: bbsEnvelope.result.totalSteelWeightKg.toFixed(1), unit: 'kg' },
          { label: 'Steel Tonnes', value: bbsEnvelope.result.totalSteelTonnes.toFixed(3), unit: 'tonnes' },
          { label: 'Total Length', value: bbsEnvelope.result.totalBarsLengthM.toFixed(1), unit: 'm' },
        ],
        inputsSnapshot: { ...activeWorkspace.rebarBbs },
      };
    } else if (activeModule === 'masonry-finishes' && masonryEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'masonry-finishes',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Brickwork & Mortar`,
        notes: `Net Wall Area ${masonryEnvelope.result.netWallAreaM2} m² (${masonryEnvelope.result.totalOpeningAreaM2} m² openings deducted)`,
        status: masonryEnvelope.result.status,
        keyMetrics: [
          { label: 'Bricks (Wastage)', value: masonryEnvelope.result.bricksWithWastageCount.toString(), unit: 'Nos' },
          { label: 'Mortar Cement', value: masonryEnvelope.result.mortarCementBags50Kg.toFixed(1), unit: 'bags' },
          { label: 'Tile Boxes', value: masonryEnvelope.result.tileBoxesCount.toString(), unit: 'boxes' },
        ],
        inputsSnapshot: { ...activeWorkspace.masonry },
      };
    } else if (activeModule === 'earthwork-alignment' && earthworkEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'earthwork-alignment',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Earthwork (${activeWorkspace.earthwork.calculationType})`,
        notes: `Soil: ${activeWorkspace.earthwork.soilType} · Swell ${(earthworkEnvelope.result.swellFactor - 1) * 100}%`,
        status: earthworkEnvelope.result.status,
        keyMetrics: [
          { label: 'Bank Volume', value: earthworkEnvelope.result.bankVolumeM3.toFixed(1), unit: 'm³' },
          { label: 'Loose Volume', value: earthworkEnvelope.result.looseVolumeM3.toFixed(1), unit: 'm³' },
          { label: 'Truck Trips', value: earthworkEnvelope.result.haulTruckTripsCount10M3.toString(), unit: 'trucks' },
        ],
        inputsSnapshot: { ...activeWorkspace.earthwork },
      };
    } else if (activeModule === 'beam-analysis' && beamEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'beam-analysis',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Beam Flexure & Deflection`,
        notes: `${activeWorkspace.beam.supportCondition} span L=${activeWorkspace.beam.spanLengthM}m, w=${activeWorkspace.beam.uniformLoadKnPerM}kN/m`,
        status: beamEnvelope.result.status,
        keyMetrics: [
          { label: 'Max Moment', value: beamEnvelope.result.maxMomentKnm.toFixed(2), unit: 'kN·m' },
          { label: 'Max Shear', value: beamEnvelope.result.maxShearKn.toFixed(2), unit: 'kN' },
          { label: 'Deflection', value: beamEnvelope.result.maxDeflectionMm.toFixed(2), unit: 'mm' },
        ],
        inputsSnapshot: { ...activeWorkspace.beam },
      };
    } else if (activeModule === 'bearing-capacity' && bearingEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'bearing-capacity',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Shallow Foundation Bearing`,
        notes: `${activeWorkspace.bearing.footingShape} footing B=${activeWorkspace.bearing.footingWidthM}m`,
        status: bearingEnvelope.result.status,
        keyMetrics: [
          { label: 'Allowable q_all', value: bearingEnvelope.result.allowableBearingKpa.toFixed(1), unit: 'kPa' },
          { label: 'Applied q_app', value: bearingEnvelope.result.appliedPressureKpa.toFixed(1), unit: 'kPa' },
          { label: 'Effective FS', value: bearingEnvelope.result.effectiveSafetyFactor.toFixed(2), unit: 'ratio' },
        ],
        inputsSnapshot: { ...activeWorkspace.bearing },
      };
    } else if (activeModule === 'concrete-mix' && concreteEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'concrete-mix',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · ACI Mix Design (${activeWorkspace.concrete.targetStrengthMpa} MPa)`,
        notes: `w/c=${activeWorkspace.concrete.waterCementRatio}, slump=${activeWorkspace.concrete.slumpMm}mm`,
        status: concreteEnvelope.result.status,
        keyMetrics: [
          { label: 'Cement/m³', value: concreteEnvelope.result.cementKgPerM3.toFixed(1), unit: 'kg' },
          { label: 'Water/m³', value: concreteEnvelope.result.waterKgPerM3.toFixed(1), unit: 'kg' },
          { label: 'Density', value: concreteEnvelope.result.totalDensityKgPerM3.toFixed(1), unit: 'kg/m³' },
        ],
        inputsSnapshot: { ...activeWorkspace.concrete },
      };
    } else if (activeModule === 'open-channel' && channelEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'open-channel',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Channel Hydraulics (Q=${channelEnvelope.result.dischargeM3ps.toFixed(2)} m³/s)`,
        notes: `Regime: ${channelEnvelope.result.flowRegime.toUpperCase()}, Froude=${channelEnvelope.result.froudeNumber.toFixed(2)}`,
        status: channelEnvelope.result.status,
        keyMetrics: [
          { label: 'Discharge Q', value: channelEnvelope.result.dischargeM3ps.toFixed(2), unit: 'm³/s' },
          { label: 'Velocity V', value: channelEnvelope.result.velocityMps.toFixed(2), unit: 'm/s' },
          { label: 'Froude Fr', value: channelEnvelope.result.froudeNumber.toFixed(2), unit: 'ratio' },
        ],
        inputsSnapshot: { ...activeWorkspace.channel },
      };
    } else if (activeModule === 'continuous-beam' && continuousBeamEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'continuous-beam',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Continuous Beam (${continuousBeamEnvelope.result.spanCount} Spans)`,
        notes: `Max +M=${continuousBeamEnvelope.result.maxSaggingMomentKnm.toFixed(1)} kN·m, Max V=${continuousBeamEnvelope.result.maxShearKn.toFixed(1)} kN, σ=${continuousBeamEnvelope.result.bendingStressMpa.toFixed(1)} MPa`,
        status: continuousBeamEnvelope.result.status,
        keyMetrics: [
          { label: 'Max Moment', value: continuousBeamEnvelope.result.maxSaggingMomentKnm.toFixed(1), unit: 'kN·m' },
          { label: 'Max Shear', value: continuousBeamEnvelope.result.maxShearKn.toFixed(1), unit: 'kN' },
          { label: 'Stress σ', value: continuousBeamEnvelope.result.bendingStressMpa.toFixed(1), unit: 'MPa' },
          { label: 'DCR', value: `${(continuousBeamEnvelope.result.utilizationRatio * 100).toFixed(1)}%`, unit: 'ratio' },
        ],
        inputsSnapshot: { ...(activeWorkspace.continuousBeam || defaultContinuousBeam) },
      };
    } else if (activeModule === 'pile-capacity' && pileEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'pile-capacity',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Pile Capacity (D=${(activeWorkspace.pile?.diameterM || 0.6)}m, L=${(activeWorkspace.pile?.lengthM || 22)}m)`,
        notes: `Q_ult=${pileEnvelope.result.ultimateCapacityKn.toFixed(1)} kN, Q_all=${pileEnvelope.result.allowableCapacityKn.toFixed(1)} kN (FS=${(activeWorkspace.pile?.factorOfSafety || 2.5)})`,
        status: pileEnvelope.result.status,
        keyMetrics: [
          { label: 'Q_allowable', value: pileEnvelope.result.allowableCapacityKn.toFixed(1), unit: 'kN' },
          { label: 'Q_ultimate', value: pileEnvelope.result.ultimateCapacityKn.toFixed(1), unit: 'kN' },
          { label: 'Skin Friction Qs', value: pileEnvelope.result.skinFrictionKn.toFixed(1), unit: 'kN' },
          { label: 'End Bearing Qp', value: pileEnvelope.result.endBearingKn.toFixed(1), unit: 'kN' },
        ],
        inputsSnapshot: { ...(activeWorkspace.pile || defaultPile) },
      };
    } else if (activeModule === 'pipe-hydraulics' && pipeEnvelope.result) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'pipe-hydraulics',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Pipe Hydraulics (Q=${pipeEnvelope.result.flowRateLps} L/s)`,
        notes: `Hazen-Williams C=${(activeWorkspace.pipe?.hazenWilliamsC || 150)}, Head Loss=${pipeEnvelope.result.totalHeadLossM.toFixed(2)} m, V=${pipeEnvelope.result.velocityMps.toFixed(2)} m/s`,
        status: pipeEnvelope.result.status,
        keyMetrics: [
          { label: 'Discharge Q', value: pipeEnvelope.result.flowRateLps.toFixed(1), unit: 'L/s' },
          { label: 'Velocity V', value: pipeEnvelope.result.velocityMps.toFixed(2), unit: 'm/s' },
          { label: 'Total Loss h_L', value: pipeEnvelope.result.totalHeadLossM.toFixed(2), unit: 'm' },
          { label: 'Reynolds Re', value: pipeEnvelope.result.reynoldsNumber.toLocaleString(), unit: '-' },
        ],
        inputsSnapshot: { ...(activeWorkspace.pipe || defaultPipe) },
      };
    } else {
      return;
    }

    setAppState((prev) => ({
      ...prev,
      calculationHistory: [newRecord, ...prev.calculationHistory],
    }));

    triggerCelebration(
      'Analytical Snapshot Logged',
      `Archived snapshot #${newId.slice(0, 8)} to ${activeWorkspace.name} calculation ledger.`,
      'celebrate'
    );
  };

  // Project Workspaces Management
  const handleOpenNewWorkspace = () => {
    setNewWsEngineer(userProfile.fullName);
    setNewWsCurrency(userPreferences.defaultCurrency);
    setNewWorkspaceOpen(true);
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    const now = new Date().toISOString();

    let initialItems: TakeoffLineItem[] = [];
    if (newWsTemplate === 'clone') {
      initialItems = activeWorkspace.boq.items.map((it) => ({ ...it, id: `takeoff-${generateUUID().slice(0, 8)}` }));
    } else if (newWsTemplate === 'demo') {
      initialItems = createSampleBOQItems();
    }

    const created: CivilWorkspace = {
      ...activeWorkspace,
      id: generateUUID(),
      name: newWsName.trim(),
      projectCode: newWsCode.trim() || `CIV-${Math.floor(100 + Math.random() * 900)}`,
      siteLocation: newWsSite.trim() || 'Primary Field Sector',
      engineerOfRecord: newWsEngineer.trim() || userProfile.fullName || 'Project Engineer, PE',
      currency: newWsCurrency || userPreferences.defaultCurrency,
      createdAt: now,
      updatedAt: now,
      boq: {
        ...activeWorkspace.boq,
        currency: newWsCurrency || userPreferences.defaultCurrency,
        items: initialItems,
      },
      rateAnalysis: {
        ...activeWorkspace.rateAnalysis,
        currency: newWsCurrency || userPreferences.defaultCurrency,
      },
    };
    setAppState((prev) => ({
      ...prev,
      activeWorkspaceId: created.id,
      workspaces: [created, ...prev.workspaces],
    }));
    setNewWsName('');
    setNewWsCode('');
    setNewWsSite('');
    setNewWsEngineer('');
    setNewWsTemplate('clean');
    setNewWorkspaceOpen(false);
    setToastBanner(`Created workspace "${created.name}" (${created.projectCode}) with ${initialItems.length} takeoff items.`);
  };

  const handleOpenEditWorkspace = (ws: CivilWorkspace) => {
    setEditingWsId(ws.id);
    setEditWsName(ws.name);
    setEditWsCode(ws.projectCode);
    setEditWsSite(ws.siteLocation);
    setEditWsEngineer(ws.engineerOfRecord);
    setEditWsCurrency(ws.currency || 'BDT');
    setEditWsModalOpen(true);
  };

  const handleSaveEditWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWsId || !editWsName.trim()) return;

    setAppState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === editingWsId
          ? {
              ...ws,
              name: editWsName.trim(),
              projectCode: editWsCode.trim() || ws.projectCode,
              siteLocation: editWsSite.trim() || ws.siteLocation,
              engineerOfRecord: editWsEngineer.trim() || ws.engineerOfRecord,
              currency: editWsCurrency,
              boq: { ...ws.boq, currency: editWsCurrency },
              rateAnalysis: { ...ws.rateAnalysis, currency: editWsCurrency },
              updatedAt: new Date().toISOString(),
            }
          : ws
      ),
    }));

    setEditWsModalOpen(false);
    setEditingWsId(null);
    setToastBanner(`Updated project metadata for "${editWsName.trim()}"`);
  };

  const handleDuplicateWorkspace = (ws: CivilWorkspace) => {
    const clone: CivilWorkspace = {
      ...ws,
      id: generateUUID(),
      name: `${ws.name} (Copy)`,
      projectCode: `${ws.projectCode}-CP`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      boq: {
        ...ws.boq,
        items: ws.boq.items.map((it) => ({ ...it, id: `takeoff-${generateUUID().slice(0, 8)}` })),
      },
    };

    setAppState((prev) => ({
      ...prev,
      workspaces: [clone, ...prev.workspaces],
      activeWorkspaceId: clone.id,
    }));
    setToastBanner(`Duplicated project workspace "${clone.name}"`);
  };

  const handleAddDemoProject = () => {
    const demoWs = createDemoWorkspaces()[0];
    const exists = appState.workspaces.some((w) => w.projectCode === demoWs.projectCode);
    if (exists) {
      demoWs.id = generateUUID();
      demoWs.projectCode = `${demoWs.projectCode}-${Math.floor(100 + Math.random() * 900)}`;
    }
    const sampleHistory = createInitialHistory([demoWs]);
    setAppState((prev) => ({
      ...prev,
      workspaces: [demoWs, ...prev.workspaces],
      activeWorkspaceId: demoWs.id,
      calculationHistory: [...sampleHistory, ...prev.calculationHistory],
    }));
    setToastBanner(`Loaded demo project "${demoWs.name}" with 7 takeoffs.`);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (appState.workspaces.length <= 1) {
      setToastBanner('Cannot delete the only remaining project workspace.');
      return;
    }
    const remaining = appState.workspaces.filter((w) => w.id !== id);
    setAppState((prev) => ({
      ...prev,
      workspaces: remaining,
      activeWorkspaceId: prev.activeWorkspaceId === id ? remaining[0].id : prev.activeWorkspaceId,
      calculationHistory: prev.calculationHistory.filter((rec) => rec.workspaceId !== id),
    }));
    setToastBanner('Deleted project workspace and associated history.');
  };

  // Export Single Workspace JSON
  const handleExportSingleProject = (ws: CivilWorkspace) => {
    const jsonStr = exportProjectWorkspacePackage(ws, appState.calculationHistory);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-${ws.projectCode}-${ws.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastBanner(`Exported validated JSON for project "${ws.name}"`);
  };

  // Import Project Workspace JSON
  const handleImportProjectJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rawStr = String(reader.result);
        const parsed = parseAndValidateProjectWorkspacePackage(rawStr);
        if (parsed) {
          setAppState((prev) => ({
            ...prev,
            workspaces: [parsed.workspace, ...prev.workspaces.filter((w) => w.id !== parsed.workspace.id)],
            activeWorkspaceId: parsed.workspace.id,
            calculationHistory: [...parsed.history, ...prev.calculationHistory],
          }));
          setToastBanner(`Imported project workspace "${parsed.workspace.name}" with ${parsed.history.length} calculation logs.`);
        } else {
          setToastBanner('Invalid project workspace JSON structure.');
        }
      } catch {
        setToastBanner('Failed to parse project JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Global State JSON Export & Import
  const handleExportStateJson = () => {
    const packagePayload = {
      ...appState,
      brand: 'PB CivilLab',
      tagline: 'CALCULATE SMARTER. BUILD BETTER.',
      creator: 'PROKASH BISWAS',
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(packagePayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pb-civillab-schema-v${CURRENT_SCHEMA_VERSION}-${activeWorkspace.projectCode}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastBanner('Exported client-local Schema v2 JSON workspace package.');
  };

  const handleImportStateJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        localStorage.setItem('pb_civillab_state_v2', JSON.stringify(raw));
        const reloaded = loadPersistedState();
        setAppState(reloaded);
        setToastBanner(
          reloaded.migratedFromVersion
            ? `Migrated imported Schema v${reloaded.migratedFromVersion} → Schema v2.`
            : 'Imported Schema v2 workspace state.'
        );
      } catch {
        setToastBanner('Invalid JSON file. State remained unchanged.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteHistoryItem = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      calculationHistory: prev.calculationHistory.filter((item) => item.id !== id),
    }));
  };

  const handleClearHistory = () => {
    const isProjectOnly = historyScope === 'active-project';
    const msg = isProjectOnly
      ? `Clear calculation history records for active project "${activeWorkspace.name}"?`
      : 'Clear all calculation history records across all projects?';
    if (window.confirm(msg)) {
      setAppState((prev) => ({
        ...prev,
        calculationHistory: isProjectOnly
          ? prev.calculationHistory.filter((item) => item.workspaceId !== activeWorkspace.id)
          : [],
      }));
      setToastBanner('Cleared calculation history ledger.');
    }
  };

  const handleLoadSampleHistory = () => {
    const sample = createInitialHistory([activeWorkspace]);
    setAppState((prev) => ({
      ...prev,
      calculationHistory: [...sample, ...prev.calculationHistory],
    }));
    setToastBanner('Loaded sample calculation history records.');
  };

  const handleForceIdbSync = async () => {
    setIdbDiagnostics((prev) => ({ ...prev, syncing: true }));
    const success = await persistToIndexedDB(appState);
    await refreshIdbStats();
    setIdbDiagnostics((prev) => ({ ...prev, syncing: false }));
    setToastBanner(success ? 'Successfully backed up state snapshot to IndexedDB.' : 'IndexedDB backup failed.');
  };

  const handleRestoreFromIdb = async () => {
    const restored = await restoreStateFromIndexedDB();
    if (restored) {
      setAppState(restored);
      setToastBanner('Successfully restored workspace snapshot from IndexedDB.');
      refreshIdbStats();
    } else {
      setToastBanner('No saved state snapshot found in IndexedDB to restore.');
    }
  };

  const handleResetToClean = () => {
    if (window.confirm('Reset all workspaces to a clean slate? This will create a clean initial project with 0 takeoff items and 0 history records.')) {
      const fresh = clearAndResetStorage('clean');
      setAppState(fresh);
      setToastBanner('Reset storage to clean initial state.');
      refreshIdbStats();
    }
  };

  const handleLoadDemoDataset = () => {
    if (window.confirm('Load sample Padma River Viaduct engineering dataset? This will load pre-configured takeoff and analysis records.')) {
      const demo = clearAndResetStorage('demo');
      setAppState(demo);
      setToastBanner('Loaded Padma River Viaduct engineering demo dataset.');
      refreshIdbStats();
    }
  };

  // History filtering
  const filteredHistory = useMemo(() => {
    return appState.calculationHistory.filter((item) => {
      const matchesScope = historyScope === 'all-projects' || item.workspaceId === activeWorkspace.id;
      const matchesModule = historyFilter === 'all' || item.moduleId === historyFilter;
      const matchesQuery =
        !historySearch.trim() ||
        item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.notes.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.id.toLowerCase().includes(historySearch.toLowerCase());
      return matchesScope && matchesModule && matchesQuery;
    });
  }, [appState.calculationHistory, historyScope, activeWorkspace.id, historyFilter, historySearch]);

  const renderStatusBadge = () => {
    if (currentEnvelope.status === 'invalid') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-error)]">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Execution Blocked ({currentEnvelope.issues.length} Errors)</span>
        </span>
      );
    }
    if (currentEnvelope.status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-tertiary)]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Warning Advisory</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-success)]">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Valid Input Matrix</span>
      </span>
    );
  };

  const availableCategoryUnits = useMemo(() => {
    const std = STANDARD_UNITS[activeWorkspace.converter.category] || [];
    const custom = appState.customUnits.filter((u) => u.category === activeWorkspace.converter.category);
    return [...std, ...custom];
  }, [activeWorkspace.converter.category, appState.customUnits]);

  // Filtered BOQ items
  const filteredBOQItems = useMemo(() => {
    if (!boqEnvelope.result) return [];
    if (boqCategoryFilter === 'all') return boqEnvelope.result.items;
    return boqEnvelope.result.items.filter((it) => it.category === boqCategoryFilter);
  }, [boqEnvelope.result, boqCategoryFilter]);

  return (
    <ErrorBoundary
      onResetAppState={() => {
        setTriggerErrorTest(false);
        setAppState(loadPersistedState());
      }}
    >
      <RuntimeFaultProbe shouldThrow={triggerErrorTest} />

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportStateJson}
      />
      <input
        ref={projectFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportProjectJson}
      />

      {/* Intelligent Command Palette (Ctrl+K / /) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectModule={handleSetModule}
        recentQueries={appState.commandRecentQueries}
        onAddRecentQuery={handleAddRecentQuery}
        onOpenProfile={() => handleOpenProfileModal('profile')}
        onOpenPreferences={() => handleOpenProfileModal('preferences')}
        onOpenPresets={() => handleOpenProfileModal('presets')}
        onOpenPrintPreview={() => setPrintPreviewModalOpen(true)}
        onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
        onQuickPrint={handleQuickPrintA4Report}
        onExportPdf={handleDirectDownloadPdf}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        savedCalculations={appState.calculationHistory}
        boqItems={activeWorkspace.boq.items}
        onSelectCalculation={handleRestoreCalculation}
      />

      {showSplash && <AppSplash onComplete={() => setShowSplash(false)} />}

      <div className="screen-app-container h-screen h-[100dvh] flex flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] overflow-hidden print:hidden">
        {/* Top Bar Contract: 3 Zones */}
        <header className="shrink-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 h-16 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline-variant)]">
          {/* Zone 1: Brand & Project Switcher */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation drawer"
              className="lg:hidden touch-target-48 -ml-2 inline-flex items-center justify-center rounded-lg text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo
              variant="full"
              size="md"
              asLink={true}
              href="/"
              onClick={() => handleOpenDashboard()}
              className="shrink-0"
            />

            {/* Quick Workspace Switcher Button */}
            <button
              type="button"
              onClick={() => setWorkspaceManagerOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] cursor-pointer transition-colors"
              title="Manage Project Workspaces"
            >
              <FolderArchive className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[130px]">{activeWorkspace.name}</span>
              <span className="opacity-70 text-[10px]">({activeWorkspace.currency})</span>
            </button>
          </div>

          {/* Zone 2: Module Navigation & Command Palette Trigger */}
          <div className="hidden xl:flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
              <span>Search modules & formulas</span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[10px]">
                Ctrl K or /
              </kbd>
            </button>

            <nav
              aria-label="Primary Engineering Modules"
              className="flex items-center gap-2 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] overflow-x-auto"
            >
              <button
                type="button"
                onClick={handleOpenDashboard}
                className={`touch-target-48 px-2 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  isDashboardView
                    ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-bold'
                    : 'border-transparent hover:text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              {(Object.keys(MODULE_META) as EngineeringModuleId[]).map((modId) => {
                const isCurrent = !isDashboardView && activeModule === modId;
                return (
                  <button
                    key={modId}
                    type="button"
                    onClick={() => handleSetModule(modId)}
                    className={`touch-target-48 px-1 inline-flex items-center whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-bold'
                        : 'border-transparent hover:text-[var(--md-sys-color-on-surface)] hover:border-[var(--md-sys-color-outline)]'
                    }`}
                  >
                    {MODULE_META[modId].shortLabel}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Undo / Redo Global Header Controls */}
            <div className="hidden sm:flex items-center gap-1 border-r border-[var(--md-sys-color-outline-variant)] pr-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className={`touch-target-48 p-2 rounded-lg border border-[var(--md-sys-color-outline)] transition-colors cursor-pointer ${
                  undoStack.length > 0
                    ? 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                    : 'opacity-30 cursor-not-allowed text-[var(--md-sys-color-on-surface-variant)]'
                }`}
                title="Undo last change (Ctrl+Z)"
                aria-label="Undo last change"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className={`touch-target-48 p-2 rounded-lg border border-[var(--md-sys-color-outline)] transition-colors cursor-pointer ${
                  redoStack.length > 0
                    ? 'hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)]'
                    : 'opacity-30 cursor-not-allowed text-[var(--md-sys-color-on-surface-variant)]'
                }`}
                title="Redo change (Ctrl+Y)"
                aria-label="Redo change"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>

            {/* History Drawer Header Button */}
            <button
              type="button"
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="touch-target-48 px-2.5 md:px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-1.5 cursor-pointer relative"
              title="Calculation Session History Ledger (Ctrl+H)"
              aria-label="Open session calculation history ledger"
            >
              <History className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="hidden lg:inline">History</span>
              {appState.calculationHistory.length > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-[10px] font-mono font-bold flex items-center justify-center">
                  {appState.calculationHistory.length > 99 ? '99+' : appState.calculationHistory.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="xl:hidden touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer"
              title="Search commands (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenProfileModal('presets')}
              className="hidden sm:inline-flex touch-target-48 px-2.5 md:px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] items-center gap-1.5 cursor-pointer"
              title="Engineering Presets & Standard Mixes"
            >
              <BookmarkCheck className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="hidden lg:inline">Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintPreviewModalOpen(true)}
              className="hidden sm:inline-flex touch-target-48 px-2.5 md:px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] items-center gap-1.5 cursor-pointer btn-tactile"
              title="Print Preview & Vector PDF Submittal Engine"
            >
              <Printer className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="hidden xl:inline">Print / PDF</span>
            </button>

            {/* Sunlight High-Contrast Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setSunlightMode((prev) => {
                  const next = !prev;
                  triggerCelebration(
                    next ? 'Sunlight High-Contrast Mode Active' : 'Standard Contrast Restored',
                    next ? 'Tuned for direct bright sunlight on construction jobsites.' : 'Returned to default theme.',
                    'info'
                  );
                  return next;
                });
              }}
              className={`touch-target-48 px-2.5 md:px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5 btn-tactile ${
                sunlightMode
                  ? 'bg-amber-400 text-black border-amber-500 font-bold shadow-md'
                  : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Jobsite High-Contrast Sunlight Mode for outdoor bright sun"
            >
              <Sun className={`w-4 h-4 shrink-0 ${sunlightMode ? 'text-black' : 'text-amber-500'}`} />
              <span className="hidden xl:inline">Sunlight</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceManagerOpen(true)}
              className="touch-target-48 px-2.5 md:px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-1.5 cursor-pointer btn-tactile"
              title="Manage Projects & Takeoffs"
            >
              <FolderArchive className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="hidden md:inline">Projects</span>
            </button>

            {/* Engineer Profile & Credentials Badge Button */}
            <button
              type="button"
              onClick={() => handleOpenProfileModal('profile')}
              className="touch-target-48 px-2 md:px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-2 cursor-pointer transition-colors"
              title={userProfile.fullName ? `Engineer Profile: ${userProfile.fullName} (${userProfile.designation})` : `Set Engineer Profile (${userProfile.designation})`}
            >
              <div className="w-6 h-6 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-xs">
                {userProfile.initials || (userProfile.fullName ? userProfile.fullName.slice(0, 2).toUpperCase() : 'PE')}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight truncate max-w-[130px]">
                  {userProfile.fullName ? userProfile.fullName.split(',')[0] : 'Set Engineer Name'}
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] leading-tight truncate max-w-[130px]">
                  {userProfile.licenseNumber || userProfile.designation || userProfile.role.replace('-', ' ')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogCalculationSnapshot}
              disabled={currentEnvelope.status === 'invalid'}
              className={`touch-target-48 px-3.5 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-opacity ${
                currentEnvelope.status === 'invalid'
                  ? 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] cursor-not-allowed opacity-50'
                  : 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 cursor-pointer'
              }`}
            >
              <BookmarkCheck className="w-4 h-4 shrink-0" />
              <span>Log Snapshot</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="relative z-10 w-80 max-w-[85vw] h-full bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline-variant)] flex flex-col justify-between p-4 overflow-hidden">
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="shrink-0 flex items-center justify-between pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
                  <Logo
                    variant="full"
                    size="sm"
                    showTagline={true}
                    onClick={() => {
                      handleSetModule('boq-estimator');
                      setMobileDrawerOpen(false);
                      const mainEl = document.getElementById('top');
                      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="touch-target-48 inline-flex items-center justify-center rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                    aria-label="Close navigation drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto py-4 custom-scrollbar">
                  <div className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-2 uppercase tracking-wider">
                    Engineering Workbenches
                  </div>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenDashboard();
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full touch-target-48 px-3 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer ${
                        isDashboardView
                          ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs truncate font-semibold">Dashboard Overview</div>
                        <div className="text-[11px] font-mono opacity-75 truncate">
                          Command Center &amp; Solvers
                        </div>
                      </div>
                    </button>

                    {(Object.keys(MODULE_META) as EngineeringModuleId[]).map((modId) => {
                      const Icon = MODULE_META[modId].icon;
                      const active = !isDashboardView && activeModule === modId;
                      return (
                        <button
                          key={modId}
                          type="button"
                          onClick={() => {
                            handleSetModule(modId);
                            setMobileDrawerOpen(false);
                          }}
                          className={`w-full touch-target-48 px-3 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs truncate">{MODULE_META[modId].label}</div>
                            <div className="text-[11px] font-mono opacity-75 truncate">
                              {MODULE_META[modId].codeStandard}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    handleOpenProfileModal('profile');
                  }}
                  className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Engineer Profile &amp; Preferences</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setWorkspaceManagerOpen(true);
                  }}
                  className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <span>Projects Manager ({appState.workspaces.length})</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Desktop Split-Screen Layout */}
        <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          {/* Desktop Left Rail Sidebar */}
          <aside
            aria-label="Engineering Sidebar"
            className={`hidden lg:flex flex-col h-full border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] transition-all duration-300 ease-in-out shrink-0 select-none overflow-hidden ${
              appState.sidebarCollapsed ? 'w-16' : 'w-72'
            }`}
          >
            {/* Sidebar Top: Logo, Tagline & Collapse/Expand Rail Controls */}
            <div
              className={`shrink-0 border-b border-[var(--md-sys-color-outline-variant)]/50 transition-all duration-300 ${
                appState.sidebarCollapsed
                  ? 'p-2 flex flex-col items-center gap-2'
                  : 'p-3 flex flex-col gap-2.5'
              }`}
            >
              <div
                className={`flex items-center w-full transition-all duration-300 ${
                  appState.sidebarCollapsed
                    ? 'flex-col gap-2 justify-center'
                    : 'justify-between min-w-0'
                }`}
              >
                <div
                  className={`flex items-center min-w-0 transition-all duration-300 ${
                    appState.sidebarCollapsed ? 'justify-center w-full' : 'flex-1 mr-2 overflow-hidden'
                  }`}
                >
                  <Logo
                    variant="full"
                    size="sm"
                    showTagline={true}
                    collapsed={appState.sidebarCollapsed}
                    onClick={() => {
                      if (appState.sidebarCollapsed) {
                        handleToggleSidebar();
                      } else {
                        handleSetModule('boq-estimator');
                        const mainEl = document.getElementById('top');
                        if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleToggleSidebar}
                  aria-label={appState.sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
                  title={appState.sidebarCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
                  className={`rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer shrink-0 transition-all duration-200 ${
                    appState.sidebarCollapsed
                      ? 'w-10 h-8 mt-0.5'
                      : 'w-8 h-8'
                  }`}
                >
                  {appState.sidebarCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4 shrink-0" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4 shrink-0" />
                  )}
                </button>
              </div>

              {/* New Project Workspace Button */}
              {appState.sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={handleOpenNewWorkspace}
                  title="New Project Workspace"
                  aria-label="New Project Workspace"
                  className="w-10 h-8 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-primary)] flex items-center justify-center cursor-pointer border border-[var(--md-sys-color-outline-variant)] transition-colors"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenNewWorkspace}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer border border-[var(--md-sys-color-outline-variant)] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                  <span className="truncate">New Project Workspace</span>
                </button>
              )}
            </div>

            {/* Sidebar Middle: Scrollable Engineering Modules Directory */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto space-y-4 custom-scrollbar transition-all duration-300 ${
                appState.sidebarCollapsed ? 'p-2' : 'p-3'
              }`}
            >
              <div>
                {!appState.sidebarCollapsed && (
                  <div className="px-1 mb-2 text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider truncate">
                    Engineering Modules
                  </div>
                )}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleOpenDashboard}
                    title="PB CivilLab Overview Dashboard"
                    aria-label="Overview Dashboard"
                    className={`w-full rounded-lg flex items-center transition-all duration-200 cursor-pointer overflow-hidden ${
                      appState.sidebarCollapsed
                        ? 'h-10 justify-center px-0'
                        : 'h-11 px-3 gap-3 text-left'
                    } ${
                      isDashboardView
                        ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs'
                        : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    {!appState.sidebarCollapsed && (
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="text-xs truncate font-medium">Dashboard Overview</div>
                        <div className="text-[11px] font-mono opacity-75 truncate">
                          Command Center &amp; Solvers
                        </div>
                      </div>
                    )}
                  </button>

                  {(Object.keys(MODULE_META) as EngineeringModuleId[]).map((modId) => {
                    const Icon = MODULE_META[modId].icon;
                    const active = !isDashboardView && activeModule === modId;
                    return (
                      <button
                        key={modId}
                        type="button"
                        onClick={() => handleSetModule(modId)}
                        title={`${MODULE_META[modId].label} (${MODULE_META[modId].codeStandard})`}
                        aria-label={MODULE_META[modId].label}
                        className={`w-full rounded-lg flex items-center transition-all duration-200 cursor-pointer overflow-hidden ${
                          appState.sidebarCollapsed
                            ? 'min-h-[48px] h-12 justify-center px-0 touch-target-48'
                            : 'min-h-[48px] h-12 px-3 gap-3 text-left touch-target-48'
                        } ${
                          active
                            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold shadow-xs'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!appState.sidebarCollapsed && (
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="text-xs truncate font-medium">{MODULE_META[modId].label}</div>
                            <div className="text-[11px] font-mono opacity-75 truncate">
                              {MODULE_META[modId].codeStandard}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Bottom: Pinned Action Controls & Theme Toggle */}
            <div
              className={`shrink-0 border-t border-[var(--md-sys-color-outline-variant)] space-y-1.5 bg-[var(--md-sys-color-surface)] transition-all duration-300 ${
                appState.sidebarCollapsed ? 'p-2' : 'p-3'
              }`}
            >
              {/* Project Workspaces Manager Button */}
              <button
                type="button"
                onClick={() => setWorkspaceManagerOpen(true)}
                className={`w-full rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center transition-all duration-200 cursor-pointer overflow-hidden ${
                  appState.sidebarCollapsed
                    ? 'min-h-[48px] h-12 justify-center px-0 touch-target-48'
                    : 'min-h-[48px] h-12 px-3 gap-2.5 text-xs font-medium touch-target-48'
                }`}
                title={`Projects Manager: ${appState.workspaces.length} Projects (${activeWorkspace.currency})`}
                aria-label="Project Workspaces Manager"
              >
                <FolderArchive className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                {!appState.sidebarCollapsed && (
                  <div className="text-left min-w-0 flex-1 overflow-hidden">
                    <div className="font-semibold text-xs truncate">Projects Manager</div>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {appState.workspaces.length} Projects · {activeWorkspace.currency}
                    </div>
                  </div>
                )}
              </button>

              {/* Engineer Profile, Preferences & Presets Button */}
              <button
                type="button"
                onClick={() => handleOpenProfileModal('profile')}
                className={`w-full rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center transition-all duration-200 cursor-pointer overflow-hidden ${
                  appState.sidebarCollapsed
                    ? 'min-h-[48px] h-12 justify-center px-0 touch-target-48'
                    : 'min-h-[48px] h-12 px-3 gap-2.5 text-xs font-medium touch-target-48'
                }`}
                title={`Engineer Profile & Settings: ${userProfile.fullName || 'Project Engineer, PE'} (${userProfile.designation})`}
                aria-label="Engineer Profile and Preferences"
              >
                <User className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                {!appState.sidebarCollapsed && (
                  <div className="text-left min-w-0 flex-1 overflow-hidden">
                    <div className="font-semibold text-xs truncate">
                      {userProfile.fullName || 'Engineer Profile'}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {userProfile.designation} · Settings
                    </div>
                  </div>
                )}
              </button>

              {/* Schema Persistence Inspector Button */}
              <button
                type="button"
                onClick={() => setInspectorModalOpen(true)}
                className={`w-full rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center transition-all duration-200 cursor-pointer overflow-hidden ${
                  appState.sidebarCollapsed
                    ? 'min-h-[48px] h-12 justify-center px-0 touch-target-48'
                    : 'min-h-[48px] h-12 px-3 gap-2.5 text-xs font-medium touch-target-48'
                }`}
                title={`Schema v2 Persistence (${appState.calculationHistory.length} logs · Client-Side)`}
                aria-label="Schema v2 Persistence Inspector"
              >
                <Database className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                {!appState.sidebarCollapsed && (
                  <div className="text-left min-w-0 flex-1 overflow-hidden">
                    <div className="font-semibold text-xs truncate">Schema v2 Persistence</div>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {appState.calculationHistory.length} logs · Client-Side
                    </div>
                  </div>
                )}
              </button>

              {/* Theme Toggle (Compact Icon when collapsed, Segmented control when expanded) */}
              {appState.sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => {
                    const next: ThemePreference =
                      appState.themePreference === 'light'
                        ? 'dark'
                        : appState.themePreference === 'dark'
                        ? 'system'
                        : 'light';
                    handleThemeChange(next);
                  }}
                  title={`Theme: ${appState.themePreference} (Click to toggle)`}
                  aria-label={`Theme: ${appState.themePreference} (Click to toggle)`}
                  className="w-full min-h-[48px] h-12 touch-target-48 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center justify-center cursor-pointer transition-colors"
                >
                  {appState.themePreference === 'light' && <Sun className="w-4 h-4 text-amber-500 shrink-0" />}
                  {appState.themePreference === 'dark' && <Moon className="w-4 h-4 text-indigo-400 shrink-0" />}
                  {appState.themePreference === 'system' && <Monitor className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />}
                </button>
              ) : (
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)] min-h-[48px] items-center">
                  {(['light', 'dark', 'system'] as ThemePreference[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleThemeChange(mode)}
                      className={`min-h-[40px] h-10 touch-target-48 rounded-md text-xs font-semibold capitalize flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                        appState.themePreference === mode
                          ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs'
                          : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      {mode === 'light' && <Sun className="w-3.5 h-3.5" />}
                      {mode === 'dark' && <Moon className="w-3.5 h-3.5" />}
                      {mode === 'system' && <Monitor className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{mode}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Area — Independently Scrollable */}
          <main id="top" className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto custom-scrollbar relative focus:outline-none" tabIndex={-1}>
            {/* PRINT-ONLY OFFICIAL CALCULATION & REPORT HEADER */}
            <div className="print-only p-6 border-b-2 border-black mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <Logo variant="full" size="lg" />
                  </div>
                  <div className="font-mono text-xs uppercase font-bold tracking-widest text-gray-700 mt-1">
                    CALCULATE SMARTER. BUILD BETTER.
                  </div>
                  <div className="text-xs font-mono mt-1 text-gray-600">
                    Developed &amp; Designed by PROKASH BISWAS
                  </div>
                </div>
                <div className="text-right text-xs font-mono space-y-0.5">
                  <div className="font-bold text-sm">CIVIL ENGINEERING CALCULATION REPORT</div>
                  <div>Project: <strong>{activeWorkspace.name}</strong> [{activeWorkspace.projectCode}]</div>
                  <div>Module: <strong>{MODULE_META[activeModule].label}</strong></div>
                  <div>Code Standard: {MODULE_META[activeModule].codeStandard}</div>
                  <div>Site: {activeWorkspace.siteLocation} | EOR: {activeWorkspace.engineerOfRecord}</div>
                  <div>Timestamp: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                </div>
              </div>

              {/* AUTOMATICALLY LINKED CERTIFIED ENGINEER CREDENTIALS & SIGNATURE BLOCK */}
              <div className="mt-4 pt-3 border-t border-gray-400 grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">PREPARED &amp; CERTIFIED BY</div>
                  <div className="font-bold text-sm text-black font-sans">{userProfile.fullName || 'Project Engineer, PE'}</div>
                  <div className="text-gray-700">{userProfile.designation} · {userProfile.organization}</div>
                  <div className="text-gray-600 text-[11px] mt-0.5">
                    License ID: <strong>{userProfile.licenseNumber || 'PE-00000'}</strong>
                    {userProfile.email && ` · Email: ${userProfile.email}`}
                    {userProfile.phone && ` · Tel: ${userProfile.phone}`}
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                  <div className="text-[11px] text-gray-600 italic max-w-sm">
                    {userPreferences.reportHeaderNote || 'Verified for preliminary structural & estimation design under BNBC-2020 / ACI-318 standards.'}
                  </div>
                  {userPreferences.showEngineeringSignatureLine && (
                    <div className="mt-2 text-center w-56 border-t border-black pt-1">
                      <div className="text-[10px] font-bold text-black uppercase">
                        {userProfile.initials || 'PB'} OFFICIAL CERTIFICATION STAMP
                      </div>
                      <div className="text-[9px] text-gray-500">Engineer of Record Signature &amp; Date</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isDashboardView ? (
              <DashboardView
                activeWorkspace={activeWorkspace}
                workspaces={appState.workspaces}
                activeModule={activeModule}
                onSelectModule={handleSetModule}
                onSelectWorkspace={handleSelectWorkspace}
                onOpenNewWorkspace={handleOpenNewWorkspace}
                onOpenWorkspaceManager={() => setWorkspaceManagerOpen(true)}
                onOpenProfileModal={handleOpenProfileModal}
                onOpenPrintPreview={() => setPrintPreviewModalOpen(true)}
                onDirectDownloadPdf={handleDirectDownloadPdf}
                calculationHistory={appState.calculationHistory}
                onRestoreCalculation={handleRestoreCalculation}
                userProfile={userProfile}
                boqEnvelope={boqEnvelope}
                bbsEnvelope={bbsEnvelope}
                concreteEnvelope={concreteEnvelope}
                matEnvelope={matEnvelope}
                capacityInfo={capacityInfo}
                moduleMeta={MODULE_META}
              />
            ) : (
              <>
                {/* Context Sub-Bar (Sticky at top of Main Page) */}
                <div className="sticky top-0 z-20 shrink-0 px-4 md:px-6 py-3 bg-[var(--md-sys-color-surface-container-low)]/95 backdrop-blur-md border-b border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                  <button
                    type="button"
                    onClick={() => setWorkspaceManagerOpen(true)}
                    className="font-bold underline text-[var(--md-sys-color-primary)] hover:opacity-80 cursor-pointer"
                  >
                    [{activeWorkspace.projectCode}]
                  </button>
                  <span>{activeWorkspace.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeWorkspace.siteLocation}</span>
                  <span aria-hidden="true">·</span>
                  <span>EOR: {activeWorkspace.engineerOfRecord}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-[var(--md-sys-color-primary)]">Currency: {activeWorkspace.currency}</span>
                </div>
                <h1 className="text-lg md:text-xl font-bold text-[var(--md-sys-color-on-surface)] truncate mt-0.5">
                  {MODULE_META[activeModule].label}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <UnitPresetSelector
                  currentPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'}
                  onSelectPreset={handleSelectUnitPreset}
                  isTransitioning={isUnitSystemTransitioning}
                />
                {renderStatusBadge()}
                <button
                  type="button"
                  onClick={() => setInspectorModalOpen(true)}
                  className="touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold cursor-pointer"
                >
                  Diagnostics
                </button>
              </div>
            </div>

            {/* Rapid Preset Switcher & Preset Creator Toolbar */}
            <div className="px-4 md:px-6 pt-3 shrink-0">
              <PresetQuickBar
                activeModule={activeModule}
                presets={presets}
                onApplyPreset={handleApplyPreset}
                onOpenPresetsManager={() => handleOpenProfileModal('presets')}
                onSaveCurrentAsPreset={() => handleOpenProfileModal('presets')}
              />
            </div>

            {/* Seamless One-Click Feature Cross-Linking Continuity Banner */}
            <div className="px-4 md:px-6 pt-2 shrink-0">
              <WorkflowCrossLinkBanner
                activeModule={activeModule}
                activeWorkspace={activeWorkspace}
                onTransferBbsToBoq={handleTransferBbsToBoq}
                onTransferBearingToFootingAndPit={handleTransferBearingToFootingAndPit}
                onTransferBearingToPile={handleTransferBearingToPile}
                onTransferMixToMaterials={handleTransferMixToMaterials}
                onTransferMaterialsToBoq={handleTransferMaterialsToBoq}
                onTransferEarthworkToBoq={handleTransferEarthworkToBoq}
                onApplyRateToBoq={handleApplyRateToBOQ}
                onTransferContinuousBeamToRebar={handleTransferContinuousBeamToRebar}
                onTransferPipeToBoq={handleTransferPipeToBoq}
                bbsSteelWeightKg={bbsEnvelope.result?.totalSteelWeightKg}
                bearingFootingWidthM={activeWorkspace.bearing.footingWidthM}
                bearingEmbedmentDepthM={activeWorkspace.bearing.embedmentDepthM}
                bearingAppliedLoadKn={activeWorkspace.bearing.appliedColumnLoadKn}
                mixBatchVolumeM3={activeWorkspace.concrete.batchVolumeM3}
                matConcreteVolumeM3={activeWorkspace.concreteMaterials.wetVolumeM3}
                earthworkBankVolumeM3={earthworkEnvelope.result?.bankVolumeM3}
                rateAnalysisUnitRate={rateAnalysisEnvelope.result?.unitRatePerM3}
                continuousBeamMaxMomentKnm={continuousBeamEnvelope.result?.maxSaggingMomentKnm}
                pipeLengthM={activeWorkspace.pipe?.lengthM || defaultPipe.lengthM}
                pipeDiameterMm={activeWorkspace.pipe?.internalDiameterMm || defaultPipe.internalDiameterMm}
                pipeMaterial={activeWorkspace.pipe?.pipeMaterial || defaultPipe.pipeMaterial}
                currencySymbol={getCurrencySymbol(activeWorkspace.currency)}
              />
            </div>

            {/* Validation Issues Alert Banner (No Silent Coercion) */}
            {currentEnvelope.issues.length > 0 && (
              <div className="mx-4 md:mx-6 mt-4 p-4 rounded-xl border border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/30 text-[var(--md-sys-color-on-surface)] space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs font-mono uppercase tracking-wide text-[var(--md-sys-color-error)]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Validation Contract Diagnostics ({currentEnvelope.issues.length} Issues Identified)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  {currentEnvelope.issues.map((iss, i) => (
                    <div key={i} className="flex items-start gap-1.5 p-2 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                      <span className={`font-bold ${iss.severity === 'error' ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--md-sys-color-tertiary)]'}`}>
                        [{iss.severity.toUpperCase()}]
                      </span>
                      <span>{iss.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Split Screen Grids */}
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Parameter Input Form with Smooth Unit Transition */}
              <motion.section
                key={`inputs-pane-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                  <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Input Parameters
                  </h2>
                  <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                    48px Jobsite Controls
                  </span>
                </div>

                {/* MODULE: QUANTITY TAKEOFF & BOQ ESTIMATOR */}
                {activeModule === 'boq-estimator' && (
                  <BoqEstimatorInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    rateAnalysisResult={rateAnalysisEnvelope.result}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                    editingTakeoffItemId={editingTakeoffItemId}
                    setEditingTakeoffItemId={setEditingTakeoffItemId}
                    itemNo={itemNo}
                    setItemNo={setItemNo}
                    itemDesc={itemDesc}
                    setItemDesc={setItemDesc}
                    itemCategory={itemCategory}
                    setItemCategory={setItemCategory}
                    itemUnit={itemUnit}
                    setItemUnit={setItemUnit}
                    itemMembers={itemMembers}
                    setItemMembers={setItemMembers}
                    itemLength={itemLength}
                    setItemLength={setItemLength}
                    itemWidth={itemWidth}
                    setItemWidth={setItemWidth}
                    itemHeight={itemHeight}
                    setItemHeight={setItemHeight}
                    itemDeduction={itemDeduction}
                    setItemDeduction={setItemDeduction}
                    itemWastage={itemWastage}
                    setItemWastage={setItemWastage}
                    itemUnitRate={itemUnitRate}
                    setItemUnitRate={setItemUnitRate}
                    onSaveTakeoffItem={handleSaveTakeoffItem}
                    onApplyRateToBOQ={handleApplyRateToBOQ}
                    onClearAllBOQItems={handleClearAllBOQItems}
                    onLoadSampleBOQItems={handleLoadSampleBOQItems}
                    onExportBOQCSV={handleExportBOQCSV}
                    onSyncFromModules={handleSyncAllModulesToBoq}
                  />
                )}

                {/* MODULE: GRANULAR UNIT RATE ANALYSIS */}
                {activeModule === 'rate-analysis' && (
                  <RateAnalysisInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                    onApplyRateToBOQ={handleApplyRateToBOQ}
                  />
                )}

                {/* MODULE 0: UNIVERSAL UNIT CONVERTER & FEET-INCH PARSER */}
                {activeModule === 'unit-converter' && (
                  <UnitConverterInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    availableCategoryUnits={availableCategoryUnits}
                    activeFeetInchResult={activeFeetInchResult}
                    onOpenCustomUnitsModal={() => setCustomUnitModalOpen(true)}
                    conversionResult={activeConversionResult}
                  />
                )}

                {/* MODULE 1: CONCRETE MATERIAL & MIX TECH */}
                {activeModule === 'concrete-materials' && (
                  <ConcreteMaterialsInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 2: STRUCTURAL REBAR BBS */}
                {activeModule === 'rebar-bbs' && (
                  <RebarBbsInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 3: MASONRY & FINISHES */}
                {activeModule === 'masonry-finishes' && (
                  <MasonryFinishesInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 4: EARTHWORK & ALIGNMENT */}
                {activeModule === 'earthwork-alignment' && (
                  <EarthworkAlignmentInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 5: BEAM ANALYSIS */}
                {activeModule === 'beam-analysis' && (
                  <BeamAnalysisInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 6: BEARING CAPACITY */}
                {activeModule === 'bearing-capacity' && (
                  <BearingCapacityInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 7: CONCRETE MIX DESIGN */}
                {activeModule === 'concrete-mix' && (
                  <ConcreteMixInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 8: OPEN CHANNEL */}
                {activeModule === 'open-channel' && (
                  <OpenChannelInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE 9: CONTINUOUS BEAM */}
                {activeModule === 'continuous-beam' && (
                  <ContinuousBeamInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                  />
                )}

                {/* MODULE 10: PILE CAPACITY */}
                {activeModule === 'pile-capacity' && (
                  <PileCapacityInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                  />
                )}

                {/* MODULE 11: PIPE HYDRAULICS */}
                {activeModule === 'pipe-hydraulics' && (
                  <PipeHydraulicsInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}
              </motion.section>

              {/* Right Pane: Analytical Stage + Detailed Grids with Smooth Unit Transition */}
              <motion.section
                key={`outputs-pane-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-7 space-y-6"
              >
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 analytical-envelope-container">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                    <div className="flex items-center gap-2.5">
                      <LogoMark size={24} className="text-[var(--md-sys-color-primary)]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
                            Analytical Vector Envelope
                          </h2>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
                            {MODULE_META[activeModule].shortLabel}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                          CALCULATE SMARTER. BUILD BETTER. · {MODULE_META[activeModule].codeStandard}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Engineering Controls & View Mode Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 no-print">
                      {/* View Switcher Segmented Control */}
                      <div className="flex items-center rounded-lg p-0.5 bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                        <button
                          type="button"
                          onClick={() => setAnalyticalViewMode('graphical')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                            analyticalViewMode === 'graphical'
                              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-xs'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                          }`}
                          title="Vector Graphical Diagrams & Plots"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Graphical</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnalyticalViewMode('tabular')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                            analyticalViewMode === 'tabular'
                              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-xs'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                          }`}
                          title="Dense Tabular Schedule optimized for A4 Reports & Computations"
                        >
                          <Table className="w-3.5 h-3.5" />
                          <span>Dense Tabular</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAnalyticalViewMode('both')}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                            analyticalViewMode === 'both'
                              ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-xs'
                              : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                          }`}
                          title="Split / Combined View: Diagram + Dense Table"
                        >
                          <Columns className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Split</span>
                        </button>
                      </div>

                      {/* Dense Table Filter & Density Controls (when tabular view is active) */}
                      {analyticalViewMode !== 'graphical' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsTableCompact(!isTableCompact)}
                            className="px-2 py-1 text-[11px] font-mono font-semibold rounded-md border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] cursor-pointer"
                            title={isTableCompact ? "Switch to Standard Row Spacing" : "Switch to Compact Dense Row Spacing"}
                          >
                            {isTableCompact ? 'Normal' : 'Compact'}
                          </button>

                          <div className="relative flex items-center">
                            <Search className="w-3 h-3 text-[var(--md-sys-color-primary)] absolute left-2 pointer-events-none" />
                            <input
                              type="text"
                              value={denseTableSearch}
                              onChange={(e) => setDenseTableSearch(e.target.value)}
                              placeholder="Filter schedule..."
                              className="h-7 pl-6 pr-5 text-[11px] font-mono rounded-md border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)]/60 focus:outline-none focus:border-[var(--md-sys-color-primary)] w-28 sm:w-36 transition-all"
                            />
                            {denseTableSearch && (
                              <button
                                type="button"
                                onClick={() => setDenseTableSearch('')}
                                className="absolute right-1 p-0.5 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                aria-label="Clear filter"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Export CSV Button */}
                      <button
                        type="button"
                        onClick={handleExportAnalyticalCsv}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors shadow-2xs"
                        title="Export Itemized Analytical Calculation Schedule to CSV"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">CSV</span>
                      </button>

                      {/* Governing Equations Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowGoverningEquations(!showGoverningEquations)}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                          showGoverningEquations
                            ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                            : 'border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)]'
                        }`}
                        title="Inspect Governing Engineering Equations & Code Derivations"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span className="hidden md:inline">Equations</span>
                        {showGoverningEquations ? (
                          <ChevronUp className="w-3 h-3 opacity-70" />
                        ) : (
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        )}
                      </button>

                      {/* Copy Summary Button */}
                      <button
                        type="button"
                        onClick={handleCopyAnalyticalSummary}
                        className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
                        title="Copy Formatted Calculation Summary"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden lg:inline">{copiedSummary ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Quick Print A4 Submittal Sheet Button */}
                      <button
                        type="button"
                        onClick={handleQuickPrintA4Report}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)] cursor-pointer shadow-xs transition-colors"
                        title="Instant 1-Click Print of Verified A4 Submittal Sheet"
                      >
                        <Printer className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                        <span className="hidden sm:inline">Quick Print</span>
                      </button>

                      {/* Print A4 Report (Full Modal Engine) */}
                      <button
                        type="button"
                        onClick={() => setPrintPreviewModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-opacity"
                        title="Open Full Verified A4 Report Generator with QR & Stamps"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Print A4 Report</span>
                      </button>

                      {/* Direct Client-Side PDF Download Engine (jsPDF) */}
                      <button
                        type="button"
                        onClick={handleDirectDownloadPdf}
                        disabled={isExportingPdf}
                        className="px-3 py-1.5 rounded-lg border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50"
                        title="Direct Client-Side PDF Generation (jsPDF) with Certified QR Stamp"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isExportingPdf ? 'Exporting...' : 'Download PDF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* LIVE CAPACITY UTILIZATION & DEMAND-CAPACITY RATIO (DCR) GAUGES (STAGGERED FRAMER MOTION) */}
                  {capacityGauges && capacityGauges.length > 0 ? (
                    <DcrGaugeSuite
                      gauges={capacityGauges}
                      moduleKey={`${activeWorkspace.id}-${activeModule}`}
                      className="mb-3"
                    />
                  ) : capacityInfo ? (
                    <DcrCapacityGauge
                      capacityInfo={capacityInfo}
                      className="mb-3"
                      customIndex={0}
                    />
                  ) : null}

                  {/* COLLAPSIBLE GOVERNING CODE EQUATIONS & FORMULATIONS PANEL */}
                  {showGoverningEquations && governingEqInfo && (
                    <div className="p-4 rounded-xl border border-[var(--md-sys-color-primary)]/40 bg-[var(--md-sys-color-surface-container-low)] space-y-3 mb-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                            {governingEqInfo.category}
                          </span>
                          <h4 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                            Governing Standard: {governingEqInfo.codeStandard}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowGoverningEquations(false)}
                          className="text-xs text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] p-1 cursor-pointer"
                          aria-label="Close equations reference"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {governingEqInfo.equations.map((eq, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] space-y-1.5"
                          >
                            <div className="text-[11px] font-bold text-[var(--md-sys-color-on-surface)]">
                              {eq.name}
                            </div>
                            <div className="p-2 rounded bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono font-bold text-[var(--md-sys-color-primary)] select-all overflow-x-auto">
                              {eq.formula}
                            </div>
                            <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                              {eq.description}
                            </div>
                            <div className="text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)]/80 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/40 space-y-0.5">
                              {eq.variables.map((v, vi) => (
                                <div key={vi}>• {v}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {governingEqInfo.assumptions.length > 0 && (
                        <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-1">
                          <span className="font-bold text-[var(--md-sys-color-on-surface)]">Code Design Assumptions:</span>
                          <ul className="list-disc list-inside space-y-0.5">
                            {governingEqInfo.assumptions.map((asm, ai) => (
                              <li key={ai}>{asm}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 1. GRAPHICAL VIEW */}
                  {(analyticalViewMode === 'graphical' || analyticalViewMode === 'both') && (
                    <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-lg p-2 mb-3 analytical-diagram-container">
                      {activeModule === 'boq-estimator' && boqEnvelope.result && (
                        <BOQCostBreakdownDiagramSvg params={activeWorkspace.boq} result={boqEnvelope.result} />
                      )}
                      {activeModule === 'rate-analysis' && rateAnalysisEnvelope.result && (
                        <RateAnalysisBreakdownDiagramSvg params={activeWorkspace.rateAnalysis} result={rateAnalysisEnvelope.result} />
                      )}
                      {activeModule === 'unit-converter' && (
                        <UnitConverterDiagramSvg
                          fromUnit={activeWorkspace.converter.fromUnit}
                          toUnit={activeWorkspace.converter.toUnit}
                          inputVal={activeWorkspace.converter.inputValue}
                          outputVal={activeConversionResult.result}
                          category={activeWorkspace.converter.category}
                        />
                      )}
                      {activeModule === 'concrete-materials' && matEnvelope.result && (
                        <ConcreteMaterialsDiagramSvg params={activeWorkspace.concreteMaterials} result={matEnvelope.result} />
                      )}
                      {activeModule === 'rebar-bbs' && bbsEnvelope.result && (
                        <RebarBBSDiagramSvg params={activeWorkspace.rebarBbs} result={bbsEnvelope.result} />
                      )}
                      {activeModule === 'masonry-finishes' && masonryEnvelope.result && (
                        <MasonryDiagramSvg params={activeWorkspace.masonry} result={masonryEnvelope.result} />
                      )}
                      {activeModule === 'earthwork-alignment' && earthworkEnvelope.result && (
                        <EarthworkDiagramSvg params={activeWorkspace.earthwork} result={earthworkEnvelope.result} />
                      )}
                      {activeModule === 'beam-analysis' && beamEnvelope.result && (
                        <BeamDiagramSvg params={activeWorkspace.beam} result={beamEnvelope.result} />
                      )}
                      {activeModule === 'bearing-capacity' && bearingEnvelope.result && (
                        <BearingDiagramSvg params={activeWorkspace.bearing} result={bearingEnvelope.result} />
                      )}
                      {activeModule === 'concrete-mix' && concreteEnvelope.result && (
                        <ConcreteMixSvg params={activeWorkspace.concrete} result={concreteEnvelope.result} />
                      )}
                      {activeModule === 'open-channel' && channelEnvelope.result && (
                        <ChannelHydraulicsSvg params={activeWorkspace.channel} result={channelEnvelope.result} />
                      )}
                      {activeModule === 'continuous-beam' && continuousBeamEnvelope.result && (
                        <ContinuousBeamDiagramSvg params={activeWorkspace.continuousBeam || defaultContinuousBeam} result={continuousBeamEnvelope.result} />
                      )}
                      {activeModule === 'pile-capacity' && pileEnvelope.result && (
                        <PileCapacityDiagramSvg params={activeWorkspace.pile || defaultPile} result={pileEnvelope.result} />
                      )}
                      {activeModule === 'pipe-hydraulics' && pipeEnvelope.result && (
                        <PipeHydraulicsDiagramSvg params={activeWorkspace.pipe || defaultPipe} result={pipeEnvelope.result} />
                      )}
                    </div>
                  )}

                  {/* 2. DENSE TABULAR VIEW (A4 Print-Ready) */}
                  {(analyticalViewMode === 'tabular' || analyticalViewMode === 'both') && (
                    <div className="mb-3 space-y-2 analytical-dense-table-container">
                      <div className="flex items-center justify-between text-xs text-[var(--md-sys-color-on-surface-variant)] px-1">
                        <span className="font-bold uppercase tracking-wider text-[10px]">
                          {MODULE_META[activeModule].label} · Calculation Schedule (A4 Print-Ready)
                        </span>
                        <span className="text-[10px] font-mono">
                          Governing Standard: {MODULE_META[activeModule].codeStandard}
                        </span>
                      </div>
                      <AnalyticalDenseTable
                        activeModule={activeModule}
                        activeWorkspace={activeWorkspace}
                        currentEnvelope={currentEnvelope}
                        isCompact={isTableCompact}
                        searchQuery={denseTableSearch}
                      />
                    </div>
                  )}

                  {/* UNIVERSAL QUANTITATIVE METRICS READOUTS */}
                  {activeModule === 'unit-converter' && (
                    <UnitConverterMetrics
                      inputValue={activeWorkspace.converter.inputValue}
                      fromUnit={activeWorkspace.converter.fromUnit}
                      toUnit={activeWorkspace.converter.toUnit}
                      category={activeWorkspace.converter.category}
                      conversionResult={activeConversionResult}
                      onSwapUnits={() => {
                        updateActiveWorkspace((ws) => ({
                          ...ws,
                          converter: {
                            ...ws.converter,
                            fromUnit: ws.converter.toUnit,
                            toUnit: ws.converter.fromUnit,
                          },
                        }));
                      }}
                      onSwapWithResult={() => {
                        updateActiveWorkspace((ws) => ({
                          ...ws,
                          converter: {
                            ...ws.converter,
                            fromUnit: ws.converter.toUnit,
                            toUnit: ws.converter.fromUnit,
                            inputValue: parseFloat(activeConversionResult.result.toFixed(6)),
                          },
                        }));
                      }}
                    />
                  )}

                  {activeModule === 'concrete-materials' && matEnvelope.result && (
                    <ConcreteMaterialsMetrics
                      result={matEnvelope.result}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'beam-analysis' && beamEnvelope.result && (
                    <BeamAnalysisMetrics
                      result={beamEnvelope.result}
                      activeWorkspace={activeWorkspace}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'bearing-capacity' && bearingEnvelope.result && (
                    <BearingCapacityMetrics
                      result={bearingEnvelope.result}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'rebar-bbs' && bbsEnvelope.result && (
                    <RebarBbsMetrics
                      result={bbsEnvelope.result}
                      activeWorkspace={activeWorkspace}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'masonry-finishes' && masonryEnvelope.result && (
                    <MasonryFinishesMetrics
                      result={masonryEnvelope.result}
                      activeWorkspace={activeWorkspace}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'earthwork-alignment' && earthworkEnvelope.result && (
                    <EarthworkAlignmentMetrics
                      result={earthworkEnvelope.result}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'concrete-mix' && concreteEnvelope.result && (
                    <ConcreteMixMetrics
                      result={concreteEnvelope.result}
                      activeWorkspace={activeWorkspace}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'open-channel' && channelEnvelope.result && (
                    <OpenChannelMetrics
                      result={channelEnvelope.result}
                      customUnits={appState.customUnits}
                      getOutputUnit={getOutputUnit}
                      updateOutputUnit={updateOutputUnit}
                    />
                  )}

                  {activeModule === 'continuous-beam' && continuousBeamEnvelope.result && (
                    <ContinuousBeamMetrics
                      result={continuousBeamEnvelope.result}
                    />
                  )}

                  {activeModule === 'pile-capacity' && pileEnvelope.result && (
                    <PileCapacityMetrics
                      result={pileEnvelope.result}
                    />
                  )}

                  {activeModule === 'pipe-hydraulics' && pipeEnvelope.result && (
                    <PipeHydraulicsMetrics
                      result={pipeEnvelope.result}
                    />
                  )}
                </div>

                {/* DYNAMIC MEASUREMENT SHEET (L x W x H) & BOQ SPREADSHEET TABLE */}
                {activeModule === 'boq-estimator' && boqEnvelope.result && (
                  <BoqEstimatorTable
                    boqResult={boqEnvelope.result}
                    filteredBOQItems={filteredBOQItems}
                    boqCategoryFilter={boqCategoryFilter}
                    setBoqCategoryFilter={setBoqCategoryFilter}
                    onEditTakeoffItem={handleEditTakeoffItem}
                    onDuplicateTakeoffItem={handleDuplicateTakeoffItem}
                    onDeleteTakeoffItem={handleDeleteTakeoffItem}
                    onLoadSampleBOQItems={handleLoadSampleBOQItems}
                  />
                )}

                {/* RATE ANALYSIS COMPOSITE BREAKDOWN TABLES */}
                {activeModule === 'rate-analysis' && rateAnalysisEnvelope.result && (
                  <RateAnalysisTables rateResult={rateAnalysisEnvelope.result} />
                )}

                {/* Calculation History */}
                <CalculationHistoryLedger
                  filteredHistory={filteredHistory}
                  historyScope={historyScope}
                  setHistoryScope={setHistoryScope}
                  activeProjectCode={activeWorkspace.projectCode}
                  onClearHistory={handleClearHistory}
                  onLoadSampleHistory={handleLoadSampleHistory}
                  onDeleteHistoryItem={handleDeleteHistoryItem}
                />
              </motion.section>
            </div>
              </>
            )}

            {/* PB CivilLab Global Engineered Footer */}
            <Footer
              onNavigateHome={() => {
                handleSetModule('boq-estimator');
                const mainEl = document.getElementById('top');
                if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="mt-12 no-print"
            />
          </main>
        </div>

        {/* ADAPTIVE MOBILE BOTTOM NAVIGATION BAR (Material Design 3 - 48px touch targets) */}
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[var(--md-sys-color-surface-container)]/95 backdrop-blur-md border-t border-[var(--md-sys-color-outline-variant)] px-2 py-1 flex items-center justify-around shadow-lg"
        >
          <button
            type="button"
            onClick={handleOpenDashboard}
            className={`touch-target-48 min-w-[60px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors cursor-pointer ${
              isDashboardView
                ? 'text-[var(--md-sys-color-primary)] font-bold'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition-colors ${
                isDashboardView ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' : ''
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className={`touch-target-48 min-w-[60px] flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors cursor-pointer ${
              !isDashboardView
                ? 'text-[var(--md-sys-color-primary)] font-bold'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <div
              className={`px-3 py-1 rounded-full transition-colors ${
                !isDashboardView ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]' : ''
              }`}
            >
              <Calculator className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">Solvers</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetModule('boq-estimator')}
            className="touch-target-48 min-w-[60px] flex flex-col items-center justify-center gap-0.5 rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          >
            <div className="px-3 py-1 rounded-full">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">Takeoff</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceManagerOpen(true)}
            className="touch-target-48 min-w-[60px] flex flex-col items-center justify-center gap-0.5 rounded-2xl text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
          >
            <div className="px-3 py-1 rounded-full">
              <FolderArchive className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">Projects</span>
          </button>

          <button
            type="button"
            onClick={handleDirectDownloadPdf}
            className="touch-target-48 min-w-[60px] flex flex-col items-center justify-center gap-0.5 rounded-2xl text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-colors cursor-pointer"
            title="Direct Download Certified PDF"
          >
            <div className="px-3 py-1 rounded-full bg-emerald-500/10">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold leading-none">PDF</span>
          </button>
        </nav>

        {/* PROJECT WORKSPACES MANAGER MODAL */}
        <WorkspaceManagerModal
          isOpen={workspaceManagerOpen}
          onClose={() => setWorkspaceManagerOpen(false)}
          workspaces={appState.workspaces}
          activeWorkspaceId={activeWorkspace.id}
          calculationHistory={appState.calculationHistory}
          onSwitchWorkspace={(id, name) => {
            setAppState((prev) => ({ ...prev, activeWorkspaceId: id }));
            setToastBanner(`Switched active workspace to "${name}"`);
          }}
          onOpenNewWorkspace={() => {
            setWorkspaceManagerOpen(false);
            handleOpenNewWorkspace();
          }}
          onOpenEditWorkspace={(ws) => {
            setWorkspaceManagerOpen(false);
            handleOpenEditWorkspace(ws);
          }}
          onDuplicateWorkspace={handleDuplicateWorkspace}
          onExportSingleProject={handleExportSingleProject}
          onDeleteWorkspace={handleDeleteWorkspace}
          onImportProjectJson={() => projectFileInputRef.current?.click()}
          onLoadDemoProject={handleAddDemoProject}
          onExportAllProjects={handleExportStateJson}
        />

        {/* EDIT WORKSPACE METADATA MODAL */}
        <EditWorkspaceModal
          isOpen={editWsModalOpen}
          onClose={() => setEditWsModalOpen(false)}
          onSave={handleSaveEditWorkspace}
          name={editWsName}
          setName={setEditWsName}
          code={editWsCode}
          setCode={setEditWsCode}
          site={editWsSite}
          setSite={setEditWsSite}
          engineer={editWsEngineer}
          setEngineer={setEditWsEngineer}
          currency={editWsCurrency}
          setCurrency={setEditWsCurrency}
        />

        {/* CREATE NEW WORKSPACE MODAL */}
        <NewWorkspaceModal
          isOpen={newWorkspaceOpen}
          onClose={() => setNewWorkspaceOpen(false)}
          onCreate={handleCreateWorkspace}
          name={newWsName}
          setName={setNewWsName}
          code={newWsCode}
          setCode={setNewWsCode}
          site={newWsSite}
          setSite={setNewWsSite}
          engineer={newWsEngineer}
          setEngineer={setNewWsEngineer}
          currency={newWsCurrency}
          setCurrency={setNewWsCurrency}
          template={newWsTemplate}
          setTemplate={setNewWsTemplate}
          activeWorkspaceItemCount={activeWorkspace.boq.items.length}
        />

        {/* CUSTOM UNIT MANAGER MODAL */}
        <CustomUnitModal
          isOpen={customUnitModalOpen}
          onClose={() => setCustomUnitModalOpen(false)}
          customUnits={appState.customUnits}
          onCreateUnit={handleCreateCustomUnit}
          onDeleteUnit={handleDeleteCustomUnit}
          unitName={newUnitName}
          setUnitName={setNewUnitName}
          unitSymbol={newUnitSymbol}
          setUnitSymbol={setNewUnitSymbol}
          unitCategory={newUnitCategory}
          setUnitCategory={setNewUnitCategory}
          unitFactor={newUnitFactor}
          setUnitFactor={setNewUnitFactor}
          unitDesc={newUnitDesc}
          setUnitDesc={setNewUnitDesc}
        />

        {/* Persistence Inspector Modal */}
        <PersistenceInspectorModal
          isOpen={inspectorModalOpen}
          onClose={() => setInspectorModalOpen(false)}
          appState={appState}
          idbDiagnostics={idbDiagnostics}
          onForceIdbSync={handleForceIdbSync}
          onRestoreFromIdb={handleRestoreFromIdb}
          onResetToClean={handleResetToClean}
          onLoadDemoDataset={handleLoadDemoDataset}
          onExportJson={handleExportStateJson}
          onImportJson={() => fileInputRef.current?.click()}
          onTestV1Migration={() => {
            const migrated = simulateV1MigrationSample();
            setAppState(migrated);
            setToastBanner('Simulated Legacy Schema v1 → v2 Migration.');
          }}
          onTestErrorBoundary={() => setTriggerErrorTest(true)}
        />

        {/* User Profile, Custom Preferences & Presets Modal */}
        <ProfilePreferencesModal
          isOpen={profilePreferencesModalOpen}
          onClose={() => setProfilePreferencesModalOpen(false)}
          userProfile={userProfile}
          userPreferences={userPreferences}
          presets={presets}
          activeWorkspace={activeWorkspace}
          onSaveProfile={handleSaveProfile}
          onSavePreferences={handleSavePreferences}
          onSavePreset={handleSavePreset}
          onDeletePreset={handleDeletePreset}
          onApplyPreset={handleApplyPreset}
          onImportPresets={handleImportPresets}
          onResetFactoryPresets={handleResetFactoryPresets}
          onApplyPreferencesToWorkspace={handleApplyPreferencesToWorkspace}
          initialTab={profileModalInitialTab}
        />

        {/* Professional Print Preview & Flawless Vector PDF Engine Modal */}
        <PrintPreviewModal
          isOpen={printPreviewModalOpen}
          onClose={() => setPrintPreviewModalOpen(false)}
          activeWorkspace={activeWorkspace}
          activeModule={activeModule}
          userProfile={userProfile}
          userPreferences={userPreferences}
          moduleMeta={{
            label: MODULE_META[activeModule].label,
            codeStandard: MODULE_META[activeModule].codeStandard,
          }}
          currentEnvelope={currentEnvelope}
        />

        {/* Persistent Floating Contextual Quick-Action Toolbar */}
        <FloatingActionBar
          onQuickPrint={handleQuickPrintA4Report}
          onExportPdf={handleDirectDownloadPdf}
          isExportingPdf={isExportingPdf}
          pdfExportProgress={pdfExportProgress}
          onLogSnapshot={handleLogCalculationSnapshot}
          onShareSummary={handleCopyAnalyticalSummary}
          copiedSummary={copiedSummary}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
          historyCount={appState.calculationHistory.length}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          activeModuleName={MODULE_META[activeModule]?.shortLabel}
        />

        {/* Real-time PDF Export Multi-Stage Progress Modal HUD */}
        <PdfExportProgressModal
          progress={pdfExportProgress}
          moduleName={MODULE_META[activeModule]?.label || 'Certified Engineering Submittal'}
          projectCode={activeWorkspace.projectCode}
        />

        {/* Calculation Session History Slide-Over Drawer */}
        <HistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          historyRecords={appState.calculationHistory}
          activeWorkspace={activeWorkspace}
          onRestoreRecord={handleRestoreCalculation}
          onForkRecordToProject={handleForkRecordToProject}
          onDeleteRecord={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
          onLogCurrentSnapshot={handleLogCalculationSnapshot}
          activeProjectCode={activeWorkspace.projectCode}
        />

        {/* Floating Celebratory Toast Micro-Interactions */}
        <CelebrationToast
          toast={celebrationToast}
          onDismiss={() => setCelebrationToast(null)}
        />
      </div>

      {/* Isolated root-level container for pristine vector print / PDF execution (never clipped by screen layout) */}
      <div id="pb-printable-report" className="hidden print:block bg-white text-slate-900 m-0 p-0 font-sans"></div>
    </ErrorBoundary>
  );
}
