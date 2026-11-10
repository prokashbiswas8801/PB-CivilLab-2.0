import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  Loader2,
  FileDown,
  Compass,
  Package,
  Calendar,
  Users,
  BookOpen,
  Receipt,
  Wallet,
  Layers,
  ClipboardCheck,
  ScrollText,
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
import { useTheme } from './context/ThemeContext';
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
  getOfficialModulePreset,
  getZeroBaselineForModule,
  createDefaultArchitectureParameters,
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
  CalculationEnvelope,
  BeamAnalysisResult,
  BearingAnalysisResult,
  ChannelHydraulicsResult,
  ContinuousBeamResult,
  PileCapacityResult,
  PipeHydraulicsResult,
  RebarBBSResult,
  ConcreteMixResult,
  MasonryResult,
  RateAnalysisResult,
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
import { AnalyticalDenseTable } from './components/AnalyticalDenseTable';
import { DcrCapacityGauge, DcrGaugeSuite } from './components/DcrCapacityGauge';
import { CelebrationToast, ToastMessage } from './components/CelebrationToast';
import type { PdfExportProgress } from './utils/pdfExport';
import { PdfExportProgressModal } from './components/PdfExportProgressModal';
import {
  syncAllModulesToBoq,
  syncRebarBbsToBoq,
  syncConcreteMixToBoq,
  syncMasonryToBoq,
  syncPileCapacityToBoq,
  syncSurveyingEarthworkToBoq,
  extractDesignMaterialCeilings,
  syncDesignCeilingsToInventory,
} from './utils/boqAutoSync';
import { resolveDynamicRate } from './utils/rateResolver';
import { computeBeamFlexureAndShearDesign } from './components/calculators/civil/rebarSuggestionEngine';
import { useSiteManagement } from './context/SiteManagementContext';
import { ConcreteGrade } from './types/siteManagement';
import { generateReportQrCode, GeneratedReportQrResult } from './utils/qrCode';
import {
  WorkspaceManagerModal,
  EditWorkspaceModal,
  NewWorkspaceModal,
  CustomUnitModal,
  PersistenceInspectorModal,
  HistoryDrawer,
  SiteQcModal,
} from './components/modals';
import type { EditWorkspaceData } from './components/modals/EditWorkspaceModal';
import type { NewWorkspaceData } from './components/modals/NewWorkspaceModal';
import type { NewCustomUnitData } from './components/modals/CustomUnitModal';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { WorkspaceTabs, WorkspaceTabItem } from './components/layout/WorkspaceTabs';
import { FloatingBottomDock } from './components/layout/FloatingBottomDock';
import { HomePage, AllToolsPage, SearchCommandPage, ConverterPage, HistoryPage, ProfilePage } from './components/pages';
import { TOOL_REGISTRY_MAP } from './data/toolRegistry';
import { Dashboard } from './components/dashboard/Dashboard';
import { WorkflowCrossLinkBanner } from './components/WorkflowCrossLinkBanner';
import { ReportVerificationView } from './components/ReportVerificationView';
import { VerifySubmittalModal } from './components/VerifySubmittalModal';
import { useWorkbench } from './context/WorkbenchContext';
import { useCivilLab } from './context/CivilLabContext';
import {
  PublicEngineeringReportRecord,
  decodeVerificationToken,
  getVerifiedReportById,
  saveVerifiedReport,
} from './utils/verificationEngine';
import { OfficeDocPublicPortalView } from './components/sitemanagement/OfficeDocPublicPortalView';
import {
  VerifiedOfficeDocRecord,
  decodeOfficeDocToken,
  getVerifiedOfficeDocById,
} from './utils/officeDocVerification';
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
  ConcreteMixVolumeTable,
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
import { AboutThisTool, AboutThisToolButton, AboutThisToolDrawer } from './components/ui';
import { MODULE_META } from './data/moduleMeta';
import { useHotkeys } from './hooks/useHotkeys';
import { useDebouncedPersistence } from './hooks/useDebouncedPersistence';
import { ModuleSuspenseFallback, ModalSuspenseFallback } from './components/ui/LazySuspenseFallbacks';

// Dynamic Lazy Imports for Heavy Module Views & Modals
const SiteManagementHub = React.lazy(() =>
  import('./components/sitemanagement').then((m) => ({ default: m.SiteManagementHub }))
);
const SurveyingSuite = React.lazy(() =>
  import('./components/calculators/civil').then((m) => ({ default: m.SurveyingSuite }))
);
const PrintPreviewModal = React.lazy(() =>
  import('./components/PrintPreviewModal').then((m) => ({ default: m.PrintPreviewModal }))
);
const PdfExportModal = React.lazy(() =>
  import('./components/modals/PdfExportModal').then((m) => ({ default: m.PdfExportModal }))
);
const ArchitectureByLawsModal = React.lazy(() =>
  import('./components/modals/ArchitectureByLawsModal').then((m) => ({ default: m.ArchitectureByLawsModal }))
);
const CadUtilitiesModal = React.lazy(() =>
  import('./components/modals/CadUtilitiesModal').then((m) => ({ default: m.CadUtilitiesModal }))
);

function RuntimeFaultProbe({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error(
      'Simulated Structural Matrix Singularity (User-triggered ErrorBoundary verification test)'
    );
  }
  return null;
}

export default function App() {
  const civilLab = useCivilLab();
  const workbench = useWorkbench();
  const { theme: activeEngineeringTheme, setTheme: setEngTheme } = useTheme();
  const { siteData, financialSummary, updateInventoryItem, addInventoryItem, addCubeTestRecord } = useSiteManagement();
  const [appState, setAppState] = useState<CivilLabSchemaV2>(() => loadPersistedState());
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<CivilWorkspace[]>([]);
  const [redoStack, setRedoStack] = useState<CivilWorkspace[]>([]);
  const [customUnitModalOpen, setCustomUnitModalOpen] = useState(false);
  const [workspaceManagerOpen, setWorkspaceManagerOpen] = useState(false);

  // Multi-Tab State
  const [openTabs, setOpenTabs] = useState<WorkspaceTabItem[]>([
    { id: 'dashboard', type: 'dashboard', title: 'Dashboard' },
    {
      id: 'tab-beam-analysis',
      type: 'module',
      moduleId: 'beam-analysis',
      title: 'RC Beam Analysis',
      shortCode: 'STR-01',
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('dashboard');
  const [isDashboardView, setIsDashboardView] = useState(true);

  const [osDarkPreference, setOsDarkPreference] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const [inspectorModalOpen, setInspectorModalOpen] = useState(false);

  // Modal Dialogs Open States
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<CivilWorkspace | null>(null);

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
  const [activeReportQr, setActiveReportQr] = useState<GeneratedReportQrResult | null>(null);
  const [verifiedReportRecord, setVerifiedReportRecord] = useState<PublicEngineeringReportRecord | null>(null);
  const [verifiedOfficeDocRecord, setVerifiedOfficeDocRecord] = useState<VerifiedOfficeDocRecord | null>(null);
  const [verifySubmittalModalOpen, setVerifySubmittalModalOpen] = useState(false);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [architectureInitialTab, setArchitectureInitialTab] = useState<'far' | 'staircase' | 'watertank' | 'septictank'>('far');
  const [cadModalOpen, setCadModalOpen] = useState(false);
  const [cadInitialTab, setCadInitialTab] = useState<'viewport' | 'shortcuts' | 'excel'>('viewport');
  const [siteQcModalOpen, setSiteQcModalOpen] = useState(false);
  const [aboutToolDrawerOpen, setAboutToolDrawerOpen] = useState(false);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const projectFileInputRef = useRef<HTMLInputElement | null>(null);

  // BOQ Takeoff Category Filter & Editing ID State
  const [boqCategoryFilter, setBoqCategoryFilter] = useState<'all' | TakeoffCategory>('all');
  const [editingTakeoffItemId, setEditingTakeoffItemId] = useState<string | null>(null);

  // Unit System Transition Animation State
  const [isUnitSystemTransitioning, setIsUnitSystemTransitioning] = useState(false);
  const [unitTransitionKey, setUnitTransitionKey] = useState(0);

  // PDF Export States
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingBoqPdf, setIsExportingBoqPdf] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<PdfExportProgress | null>(null);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);

  // 1. Resilient Local-First IndexedDB Hydration Fallback:
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

  // 2. Debounced Persistence Pipeline (300ms localStorage, 1000ms IndexedDB, beforeunload flush guarantee)
  const { flush: flushPersistence } = useDebouncedPersistence(appState);

  // 3. Automated Public Report Verification Engine: Parse URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const search = window.location.search;
      if (!search) return;
      const urlParams = new URLSearchParams(search);
      const verifyDocId = urlParams.get('verify');
      const tokenParam = urlParams.get('token');
      const docTokenParam = urlParams.get('docToken');
      const verifyDocParam = urlParams.get('verifyDoc');

      // 1. Office Documents Verification
      if (docTokenParam) {
        const decodedDoc = decodeOfficeDocToken(docTokenParam);
        if (decodedDoc) {
          setVerifiedOfficeDocRecord(decodedDoc);
          setShowSplash(false);
          return;
        }
      }

      if (verifyDocParam) {
        const foundDoc = getVerifiedOfficeDocById(verifyDocParam);
        if (foundDoc) {
          setVerifiedOfficeDocRecord(foundDoc);
          setShowSplash(false);
          return;
        }
      }

      // 2. Engineering Calculation Reports Verification
      if (tokenParam) {
        const decoded = decodeVerificationToken(tokenParam);
        if (decoded) {
          setVerifiedReportRecord(decoded);
          setShowSplash(false);
          return;
        }
      }

      if (verifyDocId) {
        const found = getVerifiedReportById(verifyDocId);
        if (found) {
          setVerifiedReportRecord(found);
          setShowSplash(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Error reading verification parameters:', err);
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
    if (activeModule !== 'unit-converter') return undefined;
    return convertUnitValue(
      activeWorkspace.converter.inputValue,
      activeWorkspace.converter.fromUnit,
      activeWorkspace.converter.toUnit,
      activeWorkspace.converter.category,
      appState.customUnits
    );
  }, [
    activeModule,
    activeWorkspace.converter.inputValue,
    activeWorkspace.converter.fromUnit,
    activeWorkspace.converter.toUnit,
    activeWorkspace.converter.category,
    appState.customUnits,
  ]);

  // Feet-Inch Decimal Parser Computation
  const activeFeetInchResult = useMemo(() => {
    return parseFeetInchString(activeWorkspace.converter?.feetInchRawString || '');
  }, [activeWorkspace.converter?.feetInchRawString]);

  // Available Category Units for Converter
  const availableCategoryUnits = useMemo(() => {
    const std = STANDARD_UNITS[activeWorkspace.converter.category] || [];
    const custom = (appState.customUnits || [])
      .filter((u) => u.category === activeWorkspace.converter.category)
      .map((u) => ({
        id: u.id,
        name: u.name,
        symbol: u.symbol,
        isRegional: false,
      }));
    return [...std, ...custom];
  }, [activeWorkspace.converter.category, appState.customUnits]);

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
    sectionWidthMm: 300,
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

  // --------------------------------------------------------------------------
  // LAZY ENVELOPE EVALUATION: Evaluate ONLY for the currently active module!
  // Eliminates 12 redundant matrix/equation evaluations on every single frame.
  // --------------------------------------------------------------------------
  const currentEnvelope = useMemo(() => {
    switch (activeModule) {
      case 'boq-estimator':
        return computeBOQEstimator(activeWorkspace.boq);
      case 'rate-analysis':
        return computeRateAnalysis(activeWorkspace.rateAnalysis);
      case 'unit-converter':
        return {
          status: 'valid' as const,
          issues: [],
          result: activeConversionResult,
        };
      case 'concrete-materials':
        return computeConcreteMaterials(activeWorkspace.concreteMaterials);
      case 'rebar-bbs':
        return computeRebarBBS(activeWorkspace.rebarBbs);
      case 'masonry-finishes':
        return computeMasonryFinishes(activeWorkspace.masonry);
      case 'earthwork-alignment':
        return computeEarthwork(activeWorkspace.earthwork);
      case 'beam-analysis':
        return computeBeamAnalysis(activeWorkspace.beam);
      case 'bearing-capacity':
        return computeBearingCapacity(activeWorkspace.bearing);
      case 'concrete-mix':
        return computeConcreteMix(activeWorkspace.concrete);
      case 'open-channel':
        return computeChannelHydraulics(activeWorkspace.channel);
      case 'continuous-beam':
        return computeContinuousBeam(activeWorkspace.continuousBeam || defaultContinuousBeam);
      case 'pile-capacity':
        return computePileCapacity(activeWorkspace.pile || defaultPile);
      case 'pipe-hydraulics':
        return computePipeHydraulics(activeWorkspace.pipe || defaultPipe);
      case 'surveying-suite':
        return {
          status: 'valid' as const,
          issues: [],
          result: {
            title: 'Surveying Field Leveling & Land Area',
            summary: 'Differential Leveling Arithmetic Check & Irregular Area Computations',
            status: 'valid',
          },
        };
      case 'store-inventory':
      case 'material-requisition':
      case 'schedule-roster':
      case 'labor-attendance':
      case 'field-notebook':
      case 'contractor-bills':
      case 'petty-cash':
      case 'cube-tests':
      case 'daily-progress-report':
      case 'office-docs':
        return {
          status: 'valid' as const,
          issues: [],
          result: {
            moduleId: activeModule,
            title: MODULE_META[activeModule]?.label || 'Site Management ERP',
            status: 'valid',
          },
        };
      default:
        return computeBOQEstimator(activeWorkspace.boq);
    }
  }, [
    activeModule,
    activeWorkspace.boq,
    activeWorkspace.rateAnalysis,
    activeConversionResult,
    activeWorkspace.concreteMaterials,
    activeWorkspace.rebarBbs,
    activeWorkspace.masonry,
    activeWorkspace.earthwork,
    activeWorkspace.beam,
    activeWorkspace.bearing,
    activeWorkspace.concrete,
    activeWorkspace.channel,
    activeWorkspace.continuousBeam,
    activeWorkspace.pile,
    activeWorkspace.pipe,
    defaultContinuousBeam,
    defaultPile,
    defaultPipe,
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

  // Lazy Secondary Cross-Link Banner Metrics Evaluation:
  // Evaluates metrics only on demand when viewing module and relevant to cross-link banner
  const crossLinkMetrics = useMemo(() => {
    if (isDashboardView) return {};
    const res: {
      bbsSteelWeightKg?: number;
      beamMaxMomentKnm?: number;
      masonryNetVolumeM3?: number;
      masonryBricksCount?: number;
      pileConcreteVolumeM3?: number;
      earthworkBankVolumeM3?: number;
      rateAnalysisUnitRate?: number;
      continuousBeamMaxMomentKnm?: number;
      surveyingLandAreaSqM?: number;
    } = {
      surveyingLandAreaSqM: 100,
    };

    if (activeModule === 'rebar-bbs') {
      res.bbsSteelWeightKg = (currentEnvelope.result as any)?.totalSteelWeightKg;
    } else if (activeModule === 'boq-estimator') {
      res.bbsSteelWeightKg = computeRebarBBS(activeWorkspace.rebarBbs).result?.totalSteelWeightKg;
    }

    if (activeModule === 'beam-analysis') {
      res.beamMaxMomentKnm = (currentEnvelope.result as any)?.maxMomentKnm;
    }
    if (activeModule === 'masonry-finishes') {
      res.masonryNetVolumeM3 = (currentEnvelope.result as any)?.netWallVolumeM3;
      res.masonryBricksCount = (currentEnvelope.result as any)?.bricksWithWastageCount;
    }
    if (activeModule === 'pile-capacity') {
      const pRes = currentEnvelope.result as any;
      if (pRes) {
        res.pileConcreteVolumeM3 = Number(
          (pRes.crossSectionAreaM2 * pRes.lengthM * (pRes.pileGroupSummary?.totalPiles || 1)).toFixed(2)
        );
      }
    }
    if (activeModule === 'earthwork-alignment') {
      res.earthworkBankVolumeM3 = (currentEnvelope.result as any)?.bankVolumeM3;
    }
    if (activeModule === 'rate-analysis') {
      res.rateAnalysisUnitRate = (currentEnvelope.result as any)?.unitRatePerM3;
    }
    if (activeModule === 'continuous-beam') {
      res.continuousBeamMaxMomentKnm = (currentEnvelope.result as any)?.maxSaggingMomentKnm;
    }
    return res;
  }, [isDashboardView, activeModule, currentEnvelope, activeWorkspace.rebarBbs]);

  const updateActiveWorkspace = useCallback((updater: (ws: CivilWorkspace) => CivilWorkspace) => {
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
  }, [activeWorkspace]);

  const handleUndo = useCallback(() => {
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
  }, [undoStack, activeWorkspace]);

  const handleRedo = useCallback(() => {
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
  }, [redoStack, activeWorkspace]);

  // --------------------------------------------------------------------------
  // UNIFIED AUTHORITATIVE NAVIGATION CONTROLLER
  // Consolidates isDashboardView, activeTabId, openTabs, activeModule, and civilLab.activePage
  // --------------------------------------------------------------------------
  const navigateToModule = useCallback(
    (moduleId: EngineeringModuleId, subAction?: string) => {
      // 1. Set module on workspace
      updateActiveWorkspace((ws) => {
        const nextWs = { ...ws, activeModule: moduleId };
        if (subAction === 'staircase') {
          nextWs.rebarBbs = { ...ws.rebarBbs, elementType: 'staircase-waist' as const };
        }
        return nextWs;
      });

      // 2. Set authoritative view states
      setIsDashboardView(false);
      setMobileDrawerOpen(false);
      workbench.recordToolUsage(moduleId);
      civilLab.setActivePage(moduleId === 'unit-converter' ? 'converter' : 'calculator', moduleId);

      // 3. Ensure Tab is open and selected
      const tabId = `tab-${moduleId}`;
      setOpenTabs((prev) => {
        const existing = prev.find((t) => t.id === tabId || t.moduleId === moduleId);
        if (existing) {
          setActiveTabId(existing.id);
          return prev;
        }
        const toolMeta = TOOL_REGISTRY_MAP[moduleId];
        const newTab: WorkspaceTabItem = {
          id: tabId,
          type: 'module',
          moduleId,
          title: toolMeta?.shortLabel || MODULE_META[moduleId]?.shortLabel || moduleId,
          shortCode: toolMeta?.shortCode,
        };
        setActiveTabId(tabId);
        return [...prev, newTab];
      });

      // 4. Smooth scroll to top
      const mainEl = document.getElementById('top');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updateActiveWorkspace, workbench, civilLab]
  );

  const navigateToDashboard = useCallback(
    (subPage: 'home' | 'all' | 'search' | 'converter' | 'history' | 'profile' = 'home') => {
      if (subPage === 'converter') {
        navigateToModule('unit-converter');
        return;
      }
      setActiveTabId('dashboard');
      setIsDashboardView(true);
      setMobileDrawerOpen(false);
      civilLab.setActivePage(subPage, null);
      const mainEl = document.getElementById('top');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [civilLab, navigateToModule]
  );

  const handleSelectWorkspaceTab = useCallback(
    (tabId: string) => {
      if (tabId === 'dashboard') {
        navigateToDashboard('home');
      } else {
        const targetTab = openTabs.find((t) => t.id === tabId);
        if (targetTab && targetTab.moduleId) {
          navigateToModule(targetTab.moduleId);
        } else {
          setActiveTabId(tabId);
        }
      }
    },
    [openTabs, navigateToDashboard, navigateToModule]
  );

  const handleCloseWorkspaceTab = useCallback(
    (tabId: string) => {
      if (tabId === 'dashboard') return;
      setOpenTabs((prev) => {
        const filtered = prev.filter((t) => t.id !== tabId);
        if (activeTabId === tabId) {
          const closedIdx = prev.findIndex((t) => t.id === tabId);
          const fallback = filtered[Math.max(0, closedIdx - 1)] || filtered[0];
          if (fallback) {
            if (fallback.id === 'dashboard') {
              navigateToDashboard('home');
            } else if (fallback.moduleId) {
              navigateToModule(fallback.moduleId);
            }
          }
        }
        return filtered;
      });
    },
    [activeTabId, navigateToDashboard, navigateToModule]
  );

  const handleToggleSidebar = useCallback(() => {
    setAppState((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  // --------------------------------------------------------------------------
  // CONSOLIDATED MEMOIZED KEYBOARD SHORTCUTS HOOK
  // Safely ignores inputs, textareas, selects, and contenteditable elements
  // --------------------------------------------------------------------------
  useHotkeys({
    onToggleCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
    onToggleSidebar: handleToggleSidebar,
    onToggleHistory: () => setIsHistoryDrawerOpen((prev) => !prev),
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

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
    navigateToModule(record.moduleId);
    triggerCelebration('Workspace Forked', `Created new independent project "${forkedName}" from calculation snapshot.`, 'celebrate');
  };

  // One-Click Feature Cross-Linking Handlers
  const handleTransferBbsToBoq = () => {
    const bbsEnv = (activeModule === 'rebar-bbs' ? currentEnvelope : computeRebarBBS(activeWorkspace.rebarBbs)) as CalculationEnvelope<RebarBBSResult>;
    if (!bbsEnv.result) return;
    const syncRes = syncRebarBbsToBoq(activeWorkspace, bbsEnv);
    if (syncRes.syncedItemsCount > 0) {
      updateActiveWorkspace(() => ({
        ...syncRes.updatedWorkspace,
        activeModule: 'boq-estimator',
      }));
      navigateToModule('boq-estimator');
      triggerCelebration('Rebar Schedule Synced to BOQ', syncRes.message, 'celebrate');
    } else {
      triggerCelebration('Rebar Sync Status', syncRes.message, 'info');
    }
  };

  const handleTransferMixToBoq = () => {
    const concreteEnv = (activeModule === 'concrete-mix' ? currentEnvelope : computeConcreteMix(activeWorkspace.concrete)) as CalculationEnvelope<ConcreteMixResult>;
    if (!concreteEnv.result) return;
    const syncRes = syncConcreteMixToBoq(activeWorkspace, concreteEnv);
    if (syncRes.syncedItemsCount > 0) {
      updateActiveWorkspace(() => ({
        ...syncRes.updatedWorkspace,
        activeModule: 'boq-estimator',
      }));
      navigateToModule('boq-estimator');
      triggerCelebration('Concrete Mix Synced to BOQ', syncRes.message, 'celebrate');
    } else {
      triggerCelebration('Concrete Mix Sync Status', syncRes.message, 'info');
    }
  };

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
        pitTopWidthM: Math.round((b + 0.6) * 10) / 10,
        pitTopLengthM: Math.round((b + 0.6) * 10) / 10,
        pitDepthM: df,
      },
    }));
    triggerCelebration(
      'Foundation Geometry Linked',
      `Synced Footing (${b}m × ${b}m, depth ${df}m) to Rebar BBS & Pit Excavation.`,
      'success'
    );
  };

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
    navigateToModule('pile-capacity');
    triggerCelebration(
      'Geotech Parameters Passed to Pile Module',
      `Transferred Column Load ${P} kN and soil strata parameters to Deep Pile Foundation.`,
      'success'
    );
  };

  const handleTransferBeamToRebar = () => {
    const span = activeWorkspace.beam.spanLengthM;
    const depth = activeWorkspace.beam.sectionDepthMm || 500;
    const maxM = (currentEnvelope.result as any)?.maxMomentKnm || 0;
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'rebar-bbs',
      rebarBbs: {
        ...ws.rebarBbs,
        elementType: 'beam',
        beamLengthM: span,
        beamDepthMm: depth,
        beamWidthMm: 250,
        beamMainBarDiaMm: 16,
        beamTopBarCount: 2,
        beamBotBarCount: 3,
        beamStirrupDiaMm: 8,
        beamStirrupSpacingMm: 150,
      },
    }));
    navigateToModule('rebar-bbs');
    triggerCelebration(
      'Beam Analysis Linked to Rebar BBS',
      `Transferred span (${span}m, depth ${depth}mm, M_max=${maxM.toFixed(1)} kN·m) to Beam Reinforcement BBS.`,
      'success'
    );
  };

  const handleTransferContinuousBeamToRebar = () => {
    const contEnv = (activeModule === 'continuous-beam' ? currentEnvelope : computeContinuousBeam(activeWorkspace.continuousBeam || defaultContinuousBeam)) as CalculationEnvelope<ContinuousBeamResult>;
    if (!contEnv.result) return;
    const maxM = contEnv.result.maxSaggingMomentKnm;
    const firstSpan = (activeWorkspace.continuousBeam || defaultContinuousBeam).spans[0];
    const spanL = firstSpan ? firstSpan.lengthM : 6.0;
    const depthMm = (activeWorkspace.continuousBeam || defaultContinuousBeam).sectionDepthMm || 600;
    const widthMm = (activeWorkspace.continuousBeam || defaultContinuousBeam).sectionWidthMm || 300;
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'rebar-bbs',
      rebarBbs: {
        ...ws.rebarBbs,
        elementType: 'beam',
        beamLengthM: spanL,
        beamDepthMm: depthMm,
        beamWidthMm: widthMm,
        beamMainBarDiaMm: 20,
        beamTopBarCount: 2,
        beamBotBarCount: 3,
        beamStirrupDiaMm: 8,
        beamStirrupSpacingMm: 150,
      },
    }));
    navigateToModule('rebar-bbs');
    triggerCelebration(
      'Continuous Beam Linked to Rebar BBS',
      `Transferred design span (${spanL}m, depth ${depthMm}mm, M_max=${maxM.toFixed(1)} kN·m) to Beam Reinforcement BBS.`,
      'success'
    );
  };

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
    navigateToModule('boq-estimator');
    triggerCelebration(
      'Pipeline Synced to BOQ',
      `Transferred ${lengthM}m of ${diaMm}mm Ø pipe into BOQ Plumbing schedule.`,
      'success'
    );
  };

  const handleTransferMixToMaterials = () => {
    const batchVol = activeWorkspace.concrete.batchVolumeM3;
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'concrete-materials',
      concreteMaterials: {
        ...ws.concreteMaterials,
        wetVolumeM3: batchVol,
        ratioCement: 1,
        ratioSand: 1.5,
        ratioAggregate: 3.0,
      },
    }));
    navigateToModule('concrete-materials');
    triggerCelebration(
      'Mix Volume Transferred',
      `Pushed ${batchVol} m³ concrete batch into Material Estimator.`,
      'success'
    );
  };

  const handleTransferMaterialsToBoq = () => {
    const matVol = activeWorkspace.concreteMaterials.wetVolumeM3 || 1.0;
    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'boq-estimator',
      boq: {
        ...ws.boq,
        items: [
          ...ws.boq.items,
          {
            id: `takeoff-${generateUUID().slice(0, 8)}`,
            itemNo: `${ws.boq.items.length + 1}.01`,
            description: `Concrete materials volume batch (${matVol} m³)`,
            category: 'superstructure',
            numberOfMembers: 1,
            lengthM: matVol,
            widthM: 1,
            heightM: 1,
            deductionQty: 0,
            unit: 'm3',
            wastagePercent: 3.0,
            unitRate: 8500,
          },
        ],
      },
    }));
    navigateToModule('boq-estimator');
    triggerCelebration('Materials Synced to BOQ', `Transferred ${matVol} m³ concrete materials to BOQ schedule.`, 'success');
  };

  const handleTransferMasonryToBoq = () => {
    const masonryEnv = (activeModule === 'masonry-finishes' ? currentEnvelope : computeMasonryFinishes(activeWorkspace.masonry)) as CalculationEnvelope<MasonryResult>;
    if (!masonryEnv.result) return;
    const syncRes = syncMasonryToBoq(activeWorkspace, masonryEnv);
    if (syncRes.syncedItemsCount > 0) {
      updateActiveWorkspace(() => ({
        ...syncRes.updatedWorkspace,
        activeModule: 'boq-estimator',
      }));
      navigateToModule('boq-estimator');
      triggerCelebration('Masonry Synced to BOQ', syncRes.message, 'celebrate');
    } else {
      triggerCelebration('Masonry Sync Status', syncRes.message, 'info');
    }
  };

  const handleTransferPileToBoq = () => {
    const pileEnv = (activeModule === 'pile-capacity' ? currentEnvelope : computePileCapacity(activeWorkspace.pile || defaultPile)) as CalculationEnvelope<PileCapacityResult>;
    if (!pileEnv.result) return;
    const syncRes = syncPileCapacityToBoq(activeWorkspace, pileEnv);
    if (syncRes.syncedItemsCount > 0) {
      updateActiveWorkspace(() => ({
        ...syncRes.updatedWorkspace,
        activeModule: 'boq-estimator',
      }));
      navigateToModule('boq-estimator');
      triggerCelebration('Pile Foundation Synced to BOQ', syncRes.message, 'celebrate');
    } else {
      triggerCelebration('Pile Sync Status', syncRes.message, 'info');
    }
  };

  const handleTransferEarthworkToBoq = () => {
    const bankVol = computeEarthwork(activeWorkspace.earthwork).result?.bankVolumeM3 || 0;
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
          description: `1.01 - Site earthwork excavation and compaction (${bankVol.toLocaleString()} m³)`,
        };
      } else {
        updatedItems.push({
          id: `takeoff-${generateUUID().slice(0, 8)}`,
          itemNo: '1.01',
          description: `Earthwork excavation in foundation trenches and site leveling`,
          category: 'earthwork',
          numberOfMembers: 1,
          lengthM: bankVol,
          widthM: 1,
          heightM: 1,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 5.0,
          unitRate: 185,
        });
      }
      return {
        ...ws,
        activeModule: 'boq-estimator',
        boq: { ...ws.boq, items: updatedItems },
      };
    });
    navigateToModule('boq-estimator');
    triggerCelebration(
      'Earthwork Synced to BOQ',
      `Transferred ${bankVol.toLocaleString()} m³ excavation to BOQ.`,
      'success'
    );
  };

  const handleTransferSurveyingToBoq = () => {
    const syncRes = syncSurveyingEarthworkToBoq(activeWorkspace, {
      landAreaSqM: crossLinkMetrics.surveyingLandAreaSqM || 100,
    });
    if (syncRes.syncedItemsCount > 0) {
      updateActiveWorkspace(() => ({
        ...syncRes.updatedWorkspace,
        activeModule: 'boq-estimator',
      }));
      navigateToModule('boq-estimator');
      triggerCelebration('Surveying Earthwork Synced to BOQ', syncRes.message, 'celebrate');
    } else {
      triggerCelebration('Surveying Sync Status', syncRes.message, 'info');
    }
  };

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

  const handleSwitchUnitPreset = (preset: UnitSystemPreset) => {
    setIsUnitSystemTransitioning(true);
    setUnitTransitionKey((prev) => prev + 1);

    updateActiveWorkspace((ws) => {
      const currentPreset = ws.unitPreferences?.systemPreset || 'metric';
      if (currentPreset === preset) return ws;

      const nextFieldUnits: Record<string, string> = {};
      const nextOutputUnits: Record<string, string> = {};

      const nextPresetKey = preset === 'imperial' || preset === 'regional' ? preset : 'metric';
      Object.keys(SYSTEM_PRESET_UNITS[nextPresetKey]).forEach((catKey) => {
        const targetUnit = SYSTEM_PRESET_UNITS[nextPresetKey][catKey as UnitCategoryKey];
        if (targetUnit) {
          nextFieldUnits[catKey] = targetUnit;
          nextOutputUnits[catKey] = targetUnit;
        }
      });

      return {
        ...ws,
        unitPreferences: {
          systemPreset: preset,
          fieldUnits: nextFieldUnits,
          outputUnits: nextOutputUnits,
        },
      };
    });

    const presetLabel =
      preset === 'metric'
        ? 'SI (METRIC STANDARD)'
        : preset === 'regional'
        ? 'BANGLADESH STANDARD (BNBC / LOCAL SITE)'
        : 'IMPERIAL (US)';
    setToastBanner(`Switched project unit system to ${presetLabel} · Values smoothly converted`);

    setTimeout(() => {
      setIsUnitSystemTransitioning(false);
    }, 380);
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
    navigateToModule(record.moduleId);
    setToastBanner(`Restored ${record.title}`);
  };

  const handleThemeChange = (pref: ThemePreference) => {
    setAppState((prev) => ({ ...prev, themePreference: pref }));
    if (pref === 'dark') {
      setEngTheme('obsidian-gold');
    } else if (pref === 'light') {
      setEngTheme('editorial-parchment');
    }
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
      if (payload.continuousBeam) {
        nextWs.continuousBeam = { ...nextWs.continuousBeam, ...payload.continuousBeam } as any;
      }
      if (payload.pile) {
        nextWs.pile = { ...nextWs.pile, ...payload.pile } as any;
      }
      if (payload.pipe) {
        nextWs.pipe = { ...nextWs.pipe, ...payload.pipe } as any;
      }
      if (payload.surveying) {
        nextWs.surveying = { ...nextWs.surveying, ...payload.surveying } as any;
      }
      return nextWs;
    });
    setToastBanner(`Applied preset "${preset.name}" to current workspace.`);
  };

  const handleResetModuleToZero = (modId: EngineeringModuleId) => {
    const zeroSlice = getZeroBaselineForModule(modId);
    updateActiveWorkspace((ws) => ({
      ...ws,
      ...zeroSlice,
    }));
    setToastBanner(`Module "${modId}" parameters reset to clean zero baseline.`);
  };

  const handleLoadStandardPresetForModule = (modId: EngineeringModuleId) => {
    const preset = getOfficialModulePreset(modId);
    if (preset) {
      handleApplyPreset(preset);
    } else {
      setToastBanner(`No official preset registered for module "${modId}".`);
    }
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
  const handleCreateCustomUnit = (data: NewCustomUnitData) => {
    if (!data.name.trim() || !data.symbol.trim() || data.toBaseFactor <= 0) return;

    const newUnit: CustomUnitDefinition = {
      id: `custom_${generateUUID().slice(0, 8)}`,
      name: data.name.trim(),
      symbol: data.symbol.trim(),
      category: data.category,
      toBaseFactor: data.toBaseFactor,
      description: data.description.trim() || 'Custom jobsite measurement unit',
    };

    setAppState((prev) => ({
      ...prev,
      customUnits: [newUnit, ...prev.customUnits],
    }));

    setCustomUnitModalOpen(false);
    setToastBanner(`Created custom engineering unit: ${newUnit.name} (${newUnit.symbol})`);
  };

  const handleDeleteCustomUnit = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      customUnits: prev.customUnits.filter((u) => u.id !== id),
    }));
  };

  const handleDuplicateTakeoffItem = (item: TakeoffLineItem) => {
    const duplicated: TakeoffLineItem = {
      ...item,
      id: `takeoff-${generateUUID().slice(0, 8)}`,
      itemNo: `${item.itemNo}-copy`,
      description: `${item.description} (Copy)`,
    };
    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: [...ws.boq.items, duplicated],
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
    const rateEnv = (activeModule === 'rate-analysis' ? currentEnvelope : computeRateAnalysis(activeWorkspace.rateAnalysis)) as CalculationEnvelope<RateAnalysisResult>;
    if (!rateEnv.result) return;
    const rateRes = rateEnv.result;

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

  // Export BOQ Takeoff as CSV Spreadsheet (Dynamic Import)
  const handleExportBOQCSV = async () => {
    if (!currentEnvelope.result) return;
    const { exportBoqCSV } = await import('./utils/exportEngine');
    exportBoqCSV(activeWorkspace, currentEnvelope.result as any, userProfile);
    setToastBanner('Exported Takeoff & BOQ CSV spreadsheet (UTF-8 BOM)');
    triggerCelebration(
      'Exported BOQ Spreadsheet',
      `Saved ${activeWorkspace.projectCode} Takeoff & BOQ Schedule with Excel UTF-8 BOM encoding.`,
      'celebrate'
    );
  };

  // --------------------------------------------------------------------------
  // LAZY REPORT QR CODE GENERATION PIPELINE
  // Generates verification QR codes lazily only when opening PrintPreviewModal,
  // triggering handleQuickPrintA4Report, or executing PDF export.
  // --------------------------------------------------------------------------
  const getOrGenerateReportQr = async (): Promise<GeneratedReportQrResult> => {
    if (activeReportQr) return activeReportQr;
    const meta = MODULE_META[activeModule] || {
      label: 'Civil Engineering Submittal',
      codeStandard: 'BNBC / ACI / AISC',
    };
    try {
      const qrRes = await generateReportQrCode({
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
      setActiveReportQr(qrRes);
      return qrRes;
    } catch (err) {
      console.warn('Failed to lazily generate report QR code:', err);
      throw err;
    }
  };

  const handleOpenPrintPreview = () => {
    setPrintPreviewModalOpen(true);
    getOrGenerateReportQr().catch((err) => console.warn('Lazy QR generation error:', err));
  };

  // Export BOQ Takeoff as Formatted PDF Report (Dynamic Import)
  const handleExportBOQPdf = async () => {
    if (!currentEnvelope.result) {
      setToastBanner('Cannot export PDF: No takeoff items available.');
      return;
    }
    try {
      setIsExportingBoqPdf(true);
      setToastBanner('Compiling tender-grade BOQ schedule & cost breakdown...');
      await getOrGenerateReportQr().catch(() => null);
      const { exportTenderBoqPdf } = await import('./utils/tenderExport');
      await exportTenderBoqPdf({
        workspace: activeWorkspace,
        boqResult: currentEnvelope.result as any,
        userProfile,
      });
      setToastBanner('Exported tender-grade BOQ report PDF.');
    } catch (err) {
      console.error('Error generating BOQ tender PDF:', err);
      setToastBanner('Failed to export BOQ PDF.');
    } finally {
      setIsExportingBoqPdf(false);
    }
  };

  // Export Analytical Dense Table as CSV Spreadsheet (Dynamic Import)
  const handleExportAnalyticalCsv = async () => {
    if (activeModule === 'boq-estimator') {
      await handleExportBOQCSV();
      return;
    }

    try {
      const { exportModuleCSV } = await import('./utils/exportEngine');
      exportModuleCSV(activeModule, activeWorkspace, currentEnvelope, userProfile);
      setToastBanner(`Exported ${MODULE_META[activeModule].shortLabel} Schedule to Excel (CSV)`);
      triggerCelebration(
        'Exported Analytical CSV',
        `Saved ${MODULE_META[activeModule].shortLabel} calculation schedule with UTF-8 BOM encoding.`,
        'celebrate'
      );
    } catch (e) {
      exportAnalyticalScheduleCsv(activeModule, activeWorkspace, currentEnvelope, userProfile);
    }
  };

  const renderQuickPrintSheetToEl = async (printEl: HTMLElement) => {
    const meta = MODULE_META[activeModule];
    const nowStr = new Date().toLocaleString();

    // Lazily ensure Scannable QR Code containing document reference & project metadata
    const qrResult = activeReportQr || (await getOrGenerateReportQr());
    const docId = qrResult.documentId;

    const tableEl = document.querySelector('.analytical-dense-table-container');
    const diagramEl = document.querySelector('.analytical-diagram-container');

    printEl.innerHTML = `
      <div class="space-y-6 font-sans text-slate-900 bg-white p-6 max-w-5xl mx-auto leading-relaxed">
        <div class="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4 print-avoid-break">
          <div class="flex items-center gap-3.5">
            <img src="${BRAND_LOGO_SRC}" alt="BD. CivilLab Official Brand Logo" class="w-14 h-14 rounded-xl object-contain border border-slate-300 shadow-xs shrink-0 bg-slate-900 p-1" />
            <div>
              <div class="text-2xl font-black font-sans tracking-tight text-blue-700">BD. CivilLab</div>
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
            <div class="flex flex-col items-center border-2 border-slate-900 rounded-lg p-1 bg-white shadow-2xs">
              <img src="${qrResult.dataUrl}" alt="Document Verification QR Code [${docId}]" class="w-20 h-20" />
              <span class="text-[7.5px] font-mono font-bold text-slate-700 mt-0.5 tracking-tight">SCAN TO VERIFY</span>
              <span class="text-[6.5px] font-mono text-slate-500">${docId}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-300 rounded print-avoid-break text-xs font-mono">
          <div>
            <div class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Project Identification</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${activeWorkspace.name} [${activeWorkspace.projectCode}]</div>
            <div class="text-slate-600 mt-0.5">Location: ${activeWorkspace.siteLocation} · Currency: ${activeWorkspace.currency}</div>
          </div>
          <div class="text-right">
            <div class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Certified Prepared By</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${userProfile.fullName || activeWorkspace.engineerOfRecord}</div>
            <div class="text-slate-600 mt-0.5">${userProfile.organization || 'Structural & Civil Engineering Consultancy'} · Reg: ${userProfile.licenseNumber || 'PE-8801-BD'}</div>
          </div>
        </div>

        ${
          diagramEl
            ? `<div class="p-4 border border-slate-300 rounded bg-white print-avoid-break">
                <div class="text-xs font-bold font-mono uppercase text-slate-600 mb-2 border-b pb-1">Structural / Analytical Schematic</div>
                <div class="flex justify-center">${diagramEl.innerHTML}</div>
              </div>`
            : ''
        }

        ${
          tableEl
            ? `<div class="border border-slate-300 rounded p-4 bg-white print-avoid-break">
                <div class="text-xs font-bold font-mono uppercase text-slate-600 mb-2 border-b pb-1">Calculation Verification &amp; Code Checks</div>
                ${tableEl.innerHTML}
              </div>`
            : ''
        }

        <div class="pt-8 border-t border-slate-300 flex items-center justify-between print-avoid-break">
          <div class="text-xs font-mono text-slate-600 space-y-1">
            <div>Cryptographic Verification Hash: <code>${qrResult.verificationHash}</code></div>
            <div>Submittal Portal: <code>https://civillab.bd/verify?doc=${docId}</code></div>
            <div class="text-[9.5px] text-slate-500">BD. CivilLab Certified Analytical Kernel · Zero-tamper public submittal verification</div>
          </div>
          <div class="text-center w-56 border-t-2 border-slate-800 pt-1.5">
            <div class="text-xs font-bold font-mono uppercase text-slate-900">${userProfile.initials || 'BD'} SEAL &amp; SIGNATURE</div>
            <div class="text-[10px] text-slate-600 font-mono">Principal Civil &amp; Structural Engineer</div>
          </div>
        </div>
      </div>
    `;
    printEl.className = 'print:block bg-white text-slate-900 p-6 font-sans m-0 leading-relaxed';
  };

  // Instant Quick Print A4 Execution with Lazily Injected Verification QR Code
  const handleQuickPrintA4Report = async () => {
    const printEl = document.getElementById('pb-printable-report');
    if (!printEl) return;
    setToastBanner('Injecting verification QR code into certified A4 report...');
    await getOrGenerateReportQr().catch(() => null);
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

  const handleDirectDownloadPdf = () => {
    setIsPdfExportModalOpen(true);
  };

  // Direct Client-Side PDF Generation & Download (jsPDF) with Dynamic Import
  const handleExecuteDirectPdfExport = async () => {
    if (!currentEnvelope || !currentEnvelope.result) {
      setToastBanner('Cannot export PDF: No calculation result is available for this module.');
      return;
    }

    setIsExportingPdf(true);
    setIsPdfExportModalOpen(false);
    setToastBanner(`Compiling certified engineering submittal for ${MODULE_META[activeModule].label}...`);

    try {
      await getOrGenerateReportQr().catch(() => null);
      const { exportCertifiedEngineeringPdf } = await import('./utils/pdfExport');
      await exportCertifiedEngineeringPdf({
        workspace: activeWorkspace,
        activeModule,
        envelope: currentEnvelope,
        userProfile,
        onProgress: (p) => setPdfExportProgress(p),
      });

      triggerCelebration(
        'Engineering Submittal Generated',
        `Generated cryptographically verified submittal for ${MODULE_META[activeModule].shortLabel} (100% complete).`,
        'celebrate'
      );
    } catch (err) {
      console.error('PDF Export Error:', err);
      setToastBanner('Failed to generate certified engineering PDF.');
    } finally {
      setIsExportingPdf(false);
      setTimeout(() => {
        setPdfExportProgress(null);
      }, 1200);
    }
  };

  // Browser Print event listeners for Ctrl+P
  useEffect(() => {
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
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [activeModule, activeWorkspace, currentEnvelope, userProfile, activeReportQr]);

  // One-Click Synchronize All Modules to BOQ Takeoff Schedule
  const handleSyncAllModulesToBoq = () => {
    const bbsEnv = computeRebarBBS(activeWorkspace.rebarBbs);
    const mixEnv = computeConcreteMix(activeWorkspace.concrete);
    const masEnv = computeMasonryFinishes(activeWorkspace.masonry);
    const pileEnv = computePileCapacity(activeWorkspace.pile || defaultPile);
    const surveyEnv = computeEarthwork(activeWorkspace.earthwork);

    const res = syncAllModulesToBoq(
      activeWorkspace,
      bbsEnv,
      mixEnv,
      masEnv,
      pileEnv
    );
    if (res.syncedItemsCount > 0) {
      updateActiveWorkspace(() => res.updatedWorkspace);
      triggerCelebration('Cross-Module Auto-Sync Complete', res.message, 'celebrate');
    } else {
      triggerCelebration('Auto-Sync Status', res.message, 'info');
    }
  };

  // Log calculation record to Session History Ledger
  const handleLogCalculationSnapshot = (customRecordOrEvent?: CalculationRecord | React.MouseEvent<unknown>) => {
    const isCustomRecord = customRecordOrEvent && !('nativeEvent' in customRecordOrEvent);
    const customRecord = isCustomRecord ? (customRecordOrEvent as CalculationRecord) : undefined;
    const newId = generateUUID();
    const now = new Date().toISOString();
    let newRecord: CalculationRecord;

    if (customRecord) {
      newRecord = {
        ...customRecord,
        id: customRecord.id || newId,
        timestamp: customRecord.timestamp || now,
        workspaceId: customRecord.workspaceId || activeWorkspace.id,
      };
    } else if (
      [
        'store-inventory',
        'material-requisition',
        'schedule-roster',
        'labor-attendance',
        'field-notebook',
        'contractor-bills',
        'petty-cash',
        'cube-tests',
        'daily-progress-report',
        'office-docs',
      ].includes(activeModule)
    ) {
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: activeModule,
        timestamp: now,
        title: `${activeWorkspace.projectCode} · ${MODULE_META[activeModule]?.label || 'Site Management ERP'}`,
        notes: `Operational state logged from site management workspace.`,
        status: 'nominal',
        keyMetrics: [
          { label: 'Site Module', value: MODULE_META[activeModule]?.shortLabel || 'Site Tool', unit: 'module' },
          { label: 'Project', value: activeWorkspace.projectCode, unit: 'code' },
        ],
        inputsSnapshot: {},
      };
    } else if (activeModule === 'beam-analysis') {
      const beamRes = currentEnvelope.result as BeamAnalysisResult;
      if (!beamRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'beam-analysis',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · RC Beam Analysis (L=${activeWorkspace.beam.spanLengthM}m)`,
        notes: `M_max=${beamRes.maxMomentKnm.toFixed(1)} kN·m, V_max=${beamRes.maxShearKn.toFixed(1)} kN, Defl=${beamRes.maxDeflectionMm.toFixed(2)} mm`,
        status: beamRes.status,
        keyMetrics: [
          { label: 'Max Moment', value: beamRes.maxMomentKnm.toFixed(1), unit: 'kN·m' },
          { label: 'Max Shear', value: beamRes.maxShearKn.toFixed(1), unit: 'kN' },
          { label: 'Max Deflection', value: beamRes.maxDeflectionMm.toFixed(2), unit: 'mm' },
          { label: 'Governing Status', value: beamRes.status.toUpperCase(), unit: 'status' },
        ],
        inputsSnapshot: { ...activeWorkspace.beam },
      };
    } else if (activeModule === 'bearing-capacity') {
      const bearingRes = currentEnvelope.result as BearingAnalysisResult;
      if (!bearingRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'bearing-capacity',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Bearing Capacity (B=${activeWorkspace.bearing.footingWidthM}m)`,
        notes: `q_allowable=${bearingRes.allowableBearingKpa.toFixed(1)} kPa (FS=${activeWorkspace.bearing.factorOfSafety})`,
        status: bearingRes.status,
        keyMetrics: [
          { label: 'q_allowable', value: bearingRes.allowableBearingKpa.toFixed(1), unit: 'kPa' },
          { label: 'q_ultimate', value: bearingRes.ultimateBearingKpa.toFixed(1), unit: 'kPa' },
          { label: 'Total Settlement', value: bearingRes.totalSettlementMm.toFixed(1), unit: 'mm' },
        ],
        inputsSnapshot: { ...activeWorkspace.bearing },
      };
    } else if (activeModule === 'concrete-mix') {
      const mixRes = currentEnvelope.result as any;
      if (!mixRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'concrete-mix',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · ACI Mix Design (f'c=${activeWorkspace.concrete.targetStrengthMpa} MPa)`,
        notes: `w/c=${mixRes.waterCementRatio.toFixed(2)}, Cement=${mixRes.cementWeightKg.toFixed(0)} kg, Batch=${mixRes.batchVolumeM3} m³`,
        status: mixRes.status,
        keyMetrics: [
          { label: 'Cement', value: `${mixRes.cementBags50kg.toFixed(1)} bags`, unit: 'bags' },
          { label: 'Water/Cement', value: mixRes.waterCementRatio.toFixed(2), unit: 'ratio' },
          { label: 'Slump Range', value: `${activeWorkspace.concrete.slumpMm} mm`, unit: 'mm' },
        ],
        inputsSnapshot: { ...activeWorkspace.concrete },
      };
    } else if (activeModule === 'open-channel') {
      const hydRes = currentEnvelope.result as ChannelHydraulicsResult;
      if (!hydRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'open-channel',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Open-Channel (Q=${hydRes.dischargeM3ps.toFixed(2)} m³/s)`,
        notes: `Flow Reg.: ${hydRes.flowRegime.toUpperCase()}, V=${hydRes.velocityMps.toFixed(2)} m/s, Fr=${hydRes.froudeNumber.toFixed(2)}`,
        status: hydRes.status,
        keyMetrics: [
          { label: 'Discharge Q', value: hydRes.dischargeM3ps.toFixed(2), unit: 'm³/s' },
          { label: 'Velocity V', value: hydRes.velocityMps.toFixed(2), unit: 'm/s' },
          { label: 'Froude Fr', value: hydRes.froudeNumber.toFixed(2), unit: '-' },
          { label: 'Critical Depth yc', value: hydRes.criticalDepthM.toFixed(3), unit: 'm' },
        ],
        inputsSnapshot: { ...activeWorkspace.channel },
      };
    } else if (activeModule === 'rebar-bbs') {
      const bbsRes = currentEnvelope.result as any;
      if (!bbsRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'rebar-bbs',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Rebar BBS (${activeWorkspace.rebarBbs.elementType.toUpperCase()})`,
        notes: `Total Steel=${(bbsRes.totalSteelWeightKg / 1000).toFixed(3)} Tonnes (${bbsRes.totalSteelWeightKg.toFixed(1)} kg)`,
        status: bbsRes.status,
        keyMetrics: [
          { label: 'Total Steel Weight', value: (bbsRes.totalSteelWeightKg / 1000).toFixed(3), unit: 'Tonnes' },
          { label: 'Main Steel', value: bbsRes.mainBarTotalWeightKg.toFixed(1), unit: 'kg' },
          { label: 'Stirrups/Ties', value: bbsRes.stirrupTotalWeightKg.toFixed(1), unit: 'kg' },
        ],
        inputsSnapshot: { ...activeWorkspace.rebarBbs },
      };
    } else if (activeModule === 'boq-estimator') {
      const boqRes = currentEnvelope.result as any;
      if (!boqRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'boq-estimator',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Quantity Takeoff (${boqRes.itemsCount} Items)`,
        notes: `Total Grand Cost = ${boqRes.currency} ${boqRes.grandTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        status: boqRes.status,
        keyMetrics: [
          { label: 'Grand Total Cost', value: boqRes.grandTotalCost.toLocaleString(), unit: boqRes.currency || 'BDT' },
          { label: 'Line Items Count', value: String(boqRes.itemsCount), unit: 'items' },
          { label: 'Direct Works', value: boqRes.subtotalCost.toLocaleString(), unit: boqRes.currency || 'BDT' },
        ],
        inputsSnapshot: { ...activeWorkspace.boq },
      };
    } else if (activeModule === 'rate-analysis') {
      const rateRes = currentEnvelope.result as any;
      if (!rateRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'rate-analysis',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Unit Rate Analysis (${rateRes.workType})`,
        notes: `Analyzed Rate = ${rateRes.currencySymbol} ${rateRes.unitRatePerM3.toFixed(2)}/m³ (${rateRes.currencySymbol} ${rateRes.unitRatePerCft.toFixed(2)}/cft)`,
        status: rateRes.status,
        keyMetrics: [
          { label: 'Rate per m³', value: rateRes.unitRatePerM3.toFixed(2), unit: `${rateRes.currencySymbol}/m³` },
          { label: 'Rate per CFT', value: rateRes.unitRatePerCft.toFixed(2), unit: `${rateRes.currencySymbol}/cft` },
          { label: 'Basic Material Cost', value: rateRes.materialCost.toFixed(2), unit: rateRes.currencySymbol },
        ],
        inputsSnapshot: { ...activeWorkspace.rateAnalysis },
      };
    } else if (activeModule === 'continuous-beam') {
      const contRes = currentEnvelope.result as ContinuousBeamResult;
      if (!contRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'continuous-beam',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Continuous Beam (${contRes.spanCount} Spans)`,
        notes: `Max +M=${contRes.maxSaggingMomentKnm.toFixed(1)} kN·m, Max V=${contRes.maxShearKn.toFixed(1)} kN, σ=${contRes.bendingStressMpa.toFixed(1)} MPa`,
        status: contRes.status,
        keyMetrics: [
          { label: 'Max Moment', value: contRes.maxSaggingMomentKnm.toFixed(1), unit: 'kN·m' },
          { label: 'Max Shear', value: contRes.maxShearKn.toFixed(1), unit: 'kN' },
          { label: 'Stress σ', value: contRes.bendingStressMpa.toFixed(1), unit: 'MPa' },
          { label: 'DCR', value: `${(contRes.utilizationRatio * 100).toFixed(1)}%`, unit: 'ratio' },
        ],
        inputsSnapshot: { ...(activeWorkspace.continuousBeam || defaultContinuousBeam) },
      };
    } else if (activeModule === 'pile-capacity') {
      const pileRes = currentEnvelope.result as PileCapacityResult;
      if (!pileRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'pile-capacity',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Pile Capacity (D=${activeWorkspace.pile?.diameterM || 0.6}m, L=${activeWorkspace.pile?.lengthM || 22}m)`,
        notes: `Q_ult=${pileRes.ultimateCapacityKn.toFixed(1)} kN, Q_all=${pileRes.allowableCapacityKn.toFixed(1)} kN (FS=${activeWorkspace.pile?.factorOfSafety || 2.5})`,
        status: pileRes.status,
        keyMetrics: [
          { label: 'Q_allowable', value: pileRes.allowableCapacityKn.toFixed(1), unit: 'kN' },
          { label: 'Q_ultimate', value: pileRes.ultimateCapacityKn.toFixed(1), unit: 'kN' },
          { label: 'Skin Friction Qs', value: pileRes.skinFrictionKn.toFixed(1), unit: 'kN' },
          { label: 'End Bearing Qp', value: pileRes.endBearingKn.toFixed(1), unit: 'kN' },
        ],
        inputsSnapshot: { ...(activeWorkspace.pile || defaultPile) },
      };
    } else if (activeModule === 'pipe-hydraulics') {
      const pipeRes = currentEnvelope.result as PipeHydraulicsResult;
      if (!pipeRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'pipe-hydraulics',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Pipe Hydraulics (Q=${pipeRes.flowRateLps} L/s)`,
        notes: `Hazen-Williams C=${activeWorkspace.pipe?.hazenWilliamsC || 150}, Head Loss=${pipeRes.totalHeadLossM.toFixed(2)} m, V=${pipeRes.velocityMps.toFixed(2)} m/s`,
        status: pipeRes.status,
        keyMetrics: [
          { label: 'Discharge Q', value: pipeRes.flowRateLps.toFixed(1), unit: 'L/s' },
          { label: 'Velocity V', value: pipeRes.velocityMps.toFixed(2), unit: 'm/s' },
          { label: 'Total Loss h_L', value: pipeRes.totalHeadLossM.toFixed(2), unit: 'm' },
          { label: 'Reynolds Re', value: pipeRes.reynoldsNumber.toLocaleString(), unit: '-' },
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

    workbench.saveCalculationSnapshot({
      moduleId: newRecord.moduleId as any,
      moduleName: MODULE_META[newRecord.moduleId]?.label || newRecord.moduleId,
      title: newRecord.title,
      unitSystem: workbench.unitSystem,
      status: newRecord.status === 'warning' ? 'warning' : 'valid',
      summaryMetrics: newRecord.keyMetrics || [],
      inputsSnapshot: newRecord.inputsSnapshot,
      resultSnapshot: (currentEnvelope.result as Record<string, unknown>) ?? undefined,
    });

    civilLab.addSavedHistoryItem({
      type: 'calculation',
      title: newRecord.title,
      moduleId: newRecord.moduleId,
      summary: newRecord.notes || '',
      status: (newRecord.status as any) || 'valid',
      keyMetrics: newRecord.keyMetrics,
      inputs: newRecord.inputsSnapshot,
      results: currentEnvelope.result,
      unitSystem: workbench.unitSystem,
    });

    triggerCelebration(
      'Snapshot Logged to Ledger',
      `Saved ${newRecord.title} with governing code checks.`,
      'success'
    );
  };

  // Workspace Creation, Editing & Duplicate Handlers
  const handleOpenNewWorkspace = () => {
    setNewWorkspaceOpen(true);
  };

  const handleCreateWorkspace = (data: NewWorkspaceData) => {
    const now = new Date().toISOString();
    let initialItems: TakeoffLineItem[] = [];
    if (data.template === 'clone') {
      initialItems = activeWorkspace.boq.items.map((it) => ({
        ...it,
        id: `takeoff-${generateUUID().slice(0, 8)}`,
      }));
    } else if (data.template === 'demo') {
      initialItems = createSampleBOQItems();
    }

    const created: CivilWorkspace = {
      ...activeWorkspace,
      id: generateUUID(),
      name: data.name.trim(),
      projectCode: data.code.trim() || `CIV-${Math.floor(100 + Math.random() * 900)}`,
      siteLocation: data.site.trim() || 'Primary Field Sector',
      engineerOfRecord: data.engineer.trim() || userProfile.fullName || 'Project Engineer, PE',
      currency: data.currency || userPreferences.defaultCurrency,
      createdAt: now,
      updatedAt: now,
      boq: {
        ...activeWorkspace.boq,
        currency: data.currency || userPreferences.defaultCurrency,
        items: initialItems,
      },
      rateAnalysis: {
        ...activeWorkspace.rateAnalysis,
        currency: data.currency || userPreferences.defaultCurrency,
      },
    };

    setAppState((prev) => ({
      ...prev,
      activeWorkspaceId: created.id,
      workspaces: [created, ...prev.workspaces],
    }));

    setNewWorkspaceOpen(false);
    setToastBanner(
      `Created workspace "${created.name}" (${created.projectCode}) with ${initialItems.length} takeoff items.`
    );
  };

  const handleOpenEditWorkspace = (ws: CivilWorkspace) => {
    setEditingWorkspace(ws);
  };

  const handleSaveEditWorkspace = (data: EditWorkspaceData) => {
    const targetId = data.id || editingWorkspace?.id;
    if (!targetId || !data.name.trim()) return;

    setAppState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === targetId
          ? {
              ...ws,
              name: data.name.trim(),
              projectCode: data.code.trim() || ws.projectCode,
              siteLocation: data.site.trim() || ws.siteLocation,
              engineerOfRecord: data.engineer.trim() || ws.engineerOfRecord,
              currency: data.currency,
              boq: { ...ws.boq, currency: data.currency },
              rateAnalysis: { ...ws.rateAnalysis, currency: data.currency },
              updatedAt: new Date().toISOString(),
            }
          : ws
      ),
    }));

    setEditingWorkspace(null);
    setToastBanner(`Updated project metadata for "${data.name.trim()}"`);
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
    const demoWorkspaces = createDemoWorkspaces();
    const existingIds = new Set(appState.workspaces.map((w) => w.id));
    const toAdd = demoWorkspaces.filter((w) => !existingIds.has(w.id));

    if (toAdd.length === 0) {
      const clonedDemo: CivilWorkspace = {
        ...demoWorkspaces[0],
        id: generateUUID(),
        name: `${demoWorkspaces[0].name} (Sample)`,
        projectCode: `PADMA-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAppState((prev) => ({
        ...prev,
        workspaces: [clonedDemo, ...prev.workspaces],
        activeWorkspaceId: clonedDemo.id,
      }));
      setToastBanner(`Loaded sample project "${clonedDemo.name}".`);
    } else {
      setAppState((prev) => ({
        ...prev,
        workspaces: [...toAdd, ...prev.workspaces],
        activeWorkspaceId: toAdd[0].id,
      }));
      setToastBanner(`Added ${toAdd.length} verified demo engineering projects.`);
    }
  };

  const handleDeleteWorkspace = (id: string, name?: string) => {
    if (appState.workspaces.length <= 1) {
      setToastBanner('Cannot delete the only remaining workspace.');
      return;
    }
    const targetName = name || appState.workspaces.find((w) => w.id === id)?.name || 'workspace';
    if (window.confirm(`Delete workspace "${targetName}"? This action cannot be undone.`)) {
      setAppState((prev) => {
        const remaining = prev.workspaces.filter((w) => w.id !== id);
        const nextActive = prev.activeWorkspaceId === id ? remaining[0].id : prev.activeWorkspaceId;
        return {
          ...prev,
          workspaces: remaining,
          activeWorkspaceId: nextActive,
        };
      });
      setToastBanner(`Deleted workspace "${targetName}".`);
    }
  };

  const handleExportStateJson = () => {
    flushPersistence();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BD_CivilLab_v${CURRENT_SCHEMA_VERSION}_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastBanner('Exported complete project workspace database as JSON.');
  };

  const handleExportSingleProject = (ws: CivilWorkspace) => {
    const pkgString = exportProjectWorkspacePackage(ws, appState.calculationHistory);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(pkgString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Project_${ws.projectCode}_${ws.name.replace(/[^a-zA-Z0-9]/g, '_')}.civillab.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setToastBanner(`Exported stand-alone project package "${ws.name}".`);
  };

  const handleImportSingleProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const jsonStr = String(reader.result);
        const validated = parseAndValidateProjectWorkspacePackage(jsonStr);
        if (!validated) {
          setToastBanner('Invalid project file format. Could not import.');
          return;
        }

        const newWsId = generateUUID();
        const importedWs: CivilWorkspace = {
          ...validated.workspace,
          id: newWsId,
          name: `${validated.workspace.name} (Imported)`,
          updatedAt: new Date().toISOString(),
        };

        const importedHistory = (validated.history || []).map((h) => ({
          ...h,
          id: generateUUID(),
          workspaceId: newWsId,
        }));

        setAppState((prev) => ({
          ...prev,
          workspaces: [importedWs, ...prev.workspaces],
          activeWorkspaceId: newWsId,
          calculationHistory: [...importedHistory, ...prev.calculationHistory],
        }));

        setToastBanner(`Imported project "${importedWs.name}" with ${importedHistory.length} calculation logs.`);
      } catch (err) {
        console.error('Import error:', err);
        setToastBanner('Failed to parse project package file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportStateJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
        const reloaded = loadPersistedState();
        setAppState(reloaded);
        setToastBanner(
          reloaded.migratedFromVersion
            ? `Migrated imported Schema v${reloaded.migratedFromVersion} → Schema v${CURRENT_SCHEMA_VERSION}.`
            : `Imported Schema v${CURRENT_SCHEMA_VERSION} workspace state.`
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

  // Filtered BOQ items computed only when in boq-estimator module
  const filteredBOQItems = useMemo(() => {
    if (activeModule !== 'boq-estimator' || !currentEnvelope.result) return [];
    const items = (currentEnvelope.result as any).items || [];
    if (boqCategoryFilter === 'all') return items;
    return items.filter((it: any) => it.category === boqCategoryFilter);
  }, [activeModule, currentEnvelope.result, boqCategoryFilter]);

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
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Notice / Serviceability Limits ({currentEnvelope.issues.length} warnings)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-primary)]">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
        <span>Nominal / Valid Envelope (All Constraints Satisfied)</span>
      </span>
    );
  };

  const handleCopySummary = () => {
    const capStr = capacityInfo ? `DCR: ${capacityInfo.percentage.toFixed(1)}% (${capacityInfo.status.toUpperCase()})` : '';
    const textToCopy = `[BD. CivilLab Certified Submittal]
Project: ${activeWorkspace.name} (${activeWorkspace.projectCode})
Module: ${MODULE_META[activeModule].label}
Governing Code: ${MODULE_META[activeModule].codeStandard}
Location: ${activeWorkspace.siteLocation}
Engineer of Record: ${userProfile.fullName || activeWorkspace.engineerOfRecord}
Timestamp: ${new Date().toLocaleString()}
Status: ${currentEnvelope.status.toUpperCase()}
${capStr ? `Governing Capacity Utilization: ${capStr}` : ''}
Key Parameters: ${JSON.stringify(currentEnvelope.result || {}, null, 2)}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedSummary(true);
    triggerCelebration('Summary Copied', 'Copied submittal summary with governing DCR to clipboard.', 'success');
    setTimeout(() => setCopiedSummary(false), 2200);
  };

  return (
    <ErrorBoundary onResetAppState={() => window.location.reload()}>
      <RuntimeFaultProbe shouldThrow={triggerErrorTest} />

      {/* Hidden File Inputs for JSON Database Sync & Project Packages */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportStateJson}
        accept=".json"
        className="hidden"
        aria-hidden="true"
      />
      <input
        type="file"
        ref={projectFileInputRef}
        onChange={handleImportSingleProjectFile}
        accept=".json"
        className="hidden"
        aria-hidden="true"
      />

      {/* Public URL Report Verification View (Stand-alone Portal Mode) */}
      {verifiedOfficeDocRecord ? (
        <OfficeDocPublicPortalView
          record={verifiedOfficeDocRecord}
          onClose={() => {
            setVerifiedOfficeDocRecord(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      ) : verifiedReportRecord ? (
        <ReportVerificationView
          record={verifiedReportRecord}
          onClose={() => {
            setVerifiedReportRecord(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      ) : showSplash ? (
        <AppSplash
          onComplete={() => setShowSplash(false)}
        />
      ) : (
        <div className="screen-app-container h-screen h-[100dvh] flex flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] overflow-hidden print:hidden">
          {/* Sticky Global Topbar */}
          <Topbar
            onToggleMobileSidebar={() => setMobileDrawerOpen((prev) => !prev)}
            onOpenCommandPalette={() => setCommandPaletteOpen(true)}
            themePreference={appState.themePreference}
            onSelectTheme={handleThemeChange}
            onOpenPrintPreview={handleOpenPrintPreview}
            onDirectDownloadPdf={handleDirectDownloadPdf}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
          />
          {/* IDE/CAD Multi-Tab Workspace Header */}
          <WorkspaceTabs
            openTabs={openTabs}
            activeTabId={activeTabId}
            onSelectTab={handleSelectWorkspaceTab}
            onCloseTab={handleCloseWorkspaceTab}
            projectName={activeWorkspace.name}
            projectCode={activeWorkspace.projectCode}
            onSaveSnapshot={handleLogCalculationSnapshot}
            onOpenProjectMetadata={() => handleOpenEditWorkspace(activeWorkspace)}
            onOpenToolPicker={() => setCommandPaletteOpen(true)}
          />

        {/* Desktop Split-Screen Layout */}
        <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          {/* Collapsible Accordion Sidebar with 6 Categories */}
          <Sidebar
            isMobileOpen={mobileDrawerOpen}
            onCloseMobile={() => setMobileDrawerOpen(false)}
            isCollapsed={appState.sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            activeModule={activeModule}
            isDashboardActive={isDashboardView}
            onSelectDashboard={() => navigateToDashboard('home')}
            onSelectModule={(id) => navigateToModule(id)}
            onOpenArchitectureModal={(tab) => {
              setArchitectureInitialTab(tab || 'far');
              setArchitectureModalOpen(true);
            }}
            onOpenCadModal={(tab) => {
              if (tab) setCadInitialTab(tab);
              setCadModalOpen(true);
            }}
            onOpenSiteQcModal={() => setSiteQcModalOpen(true)}
            onOpenWorkspaceManager={() => setWorkspaceManagerOpen(true)}
          />

          {/* Main Content Area — Independently Scrollable */}
          <main id="top" className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto custom-scrollbar relative focus:outline-none pb-24 sm:pb-28" tabIndex={-1}>
            {/* PRINT-ONLY OFFICIAL CALCULATION & REPORT HEADER */}
            <div className="print-only p-6 border-b-2 border-black mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <img src={BRAND_LOGO_SRC} alt="BD. CivilLab" className="w-10 h-10 object-contain rounded" />
                    <span className="text-2xl font-black text-black">BD. CivilLab</span>
                  </div>
                  <div className="text-xs font-mono uppercase text-gray-600 mt-1">
                    Certified Professional Engineering Calculation Submittal Sheet
                  </div>
                </div>
                <div className="text-right text-xs font-mono text-gray-700">
                  <div>Project: <strong>{activeWorkspace.name}</strong> [{activeWorkspace.projectCode}]</div>
                  <div>Location: <strong>{activeWorkspace.siteLocation}</strong></div>
                  <div>Module: <strong>{MODULE_META[activeModule].label}</strong></div>
                  <div>Code Standard: {MODULE_META[activeModule].codeStandard}</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center text-xs font-mono">
                <div>
                  Engineer of Record: <strong>{userProfile.fullName || activeWorkspace.engineerOfRecord}</strong>
                  {userProfile.licenseNumber && ` · PE Lic: ${userProfile.licenseNumber}`}
                  {userProfile.organization && ` · ${userProfile.organization}`}
                </div>
                <div className="flex flex-col items-end">
                  {userProfile.licenseNumber && (
                    <div className="mt-2 text-center w-56 border-t border-black pt-1">
                      <div className="text-[10px] font-bold text-black uppercase">
                        {userProfile.initials || 'BD'} OFFICIAL CERTIFICATION STAMP
                      </div>
                      <div className="text-[9px] text-gray-500">Engineer of Record Signature &amp; Date</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {civilLab.activePage === 'home' || (isDashboardView && !['all', 'search', 'converter', 'history', 'profile', 'calculator'].includes(civilLab.activePage)) ? (
              <HomePage
                activeWorkspace={activeWorkspace}
                workspaces={appState.workspaces}
                onSelectModule={navigateToModule}
                onSelectWorkspace={handleSelectWorkspace}
                onOpenNewWorkspace={handleOpenNewWorkspace}
                onOpenWorkspaceManager={() => setWorkspaceManagerOpen(true)}
                onOpenProfileModal={handleOpenProfileModal}
                onOpenArchitectureModal={(tab) => {
                  if (tab) setArchitectureInitialTab(tab);
                  setArchitectureModalOpen(true);
                }}
                onOpenCadModal={(tab) => {
                  if (tab) setCadInitialTab(tab);
                  setCadModalOpen(true);
                }}
                onOpenSiteQcModal={() => setSiteQcModalOpen(true)}
                onDirectDownloadPdf={handleDirectDownloadPdf}
                onOpenPrintPreview={handleOpenPrintPreview}
              />
            ) : civilLab.activePage === 'all' ? (
              <AllToolsPage
                onSelectModule={navigateToModule}
                onOpenArchitectureModal={(tab) => {
                  if (tab) setArchitectureInitialTab(tab);
                  setArchitectureModalOpen(true);
                }}
                onOpenCadModal={(tab) => {
                  if (tab) setCadInitialTab(tab);
                  setCadModalOpen(true);
                }}
                onOpenSiteQcModal={() => setSiteQcModalOpen(true)}
              />
            ) : civilLab.activePage === 'search' ? (
              <SearchCommandPage
                onSelectModule={navigateToModule}
                onOpenArchitectureModal={(tab) => {
                  if (tab) setArchitectureInitialTab(tab);
                  setArchitectureModalOpen(true);
                }}
                onOpenCadModal={(tab) => {
                  if (tab) setCadInitialTab(tab);
                  setCadModalOpen(true);
                }}
                onOpenSiteQcModal={() => setSiteQcModalOpen(true)}
                onOpenProfileModal={handleOpenProfileModal}
                onOpenPrintPreview={handleOpenPrintPreview}
                onDirectDownloadPdf={handleDirectDownloadPdf}
                onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
                onOpenWorkspaceManager={() => setWorkspaceManagerOpen(true)}
              />
            ) : civilLab.activePage === 'converter' ? (
              <div className="p-4 md:p-6">
                <ConverterPage />
              </div>
            ) : civilLab.activePage === 'history' ? (
              <div className="p-4 md:p-6">
                <HistoryPage
                  onReloadCalculation={(item) => {
                    if (item.moduleId) {
                      if (item.moduleId.startsWith('converter-')) {
                        navigateToModule('unit-converter');
                      } else {
                        navigateToModule(item.moduleId as any);
                      }
                    }
                  }}
                  onExportPdf={(item) => {
                    if (item.moduleId) {
                      navigateToModule(item.moduleId as any);
                      setIsPdfExportModalOpen(true);
                    }
                  }}
                />
              </div>
            ) : civilLab.activePage === 'profile' ? (
              <div className="p-4 md:p-6">
                <ProfilePage />
              </div>
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
                    title="Open Project Workspace Switcher &amp; Manager"
                  >
                    {activeWorkspace.name}
                  </button>
                  <span className="text-[var(--md-sys-color-outline)]">/</span>
                  <span className="font-semibold text-[var(--md-sys-color-on-surface)]">
                    {activeWorkspace.projectCode}
                  </span>
                  <span className="text-[var(--md-sys-color-outline)]">·</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Loc: {activeWorkspace.siteLocation}
                  </span>
                  <span className="text-[var(--md-sys-color-outline)]">·</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Eng: {userProfile.fullName || activeWorkspace.engineerOfRecord}
                  </span>
                </div>
                <h1 className="text-lg md:text-xl font-bold font-sans tracking-tight text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mt-0.5">
                  <span>{MODULE_META[activeModule].label}</span>
                  <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]">
                    {MODULE_META[activeModule].codeStandard}
                  </span>
                  <AboutThisToolButton
                    toolId={activeModule}
                    onClick={() => setAboutToolDrawerOpen(true)}
                  />
                </h1>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {renderStatusBadge()}

                <div className="h-4 w-px bg-[var(--md-sys-color-outline-variant)] mx-1 hidden sm:block" />

                {/* Instant Quick Print A4 Execution */}
                <button
                  type="button"
                  onClick={handleQuickPrintA4Report}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  title="Print instant 1-page A4 certified report with embedded verification QR code"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Quick Print</span>
                </button>

                {/* Open Verified Print Preview & Vector PDF Engine Modal */}
                <button
                  type="button"
                  onClick={handleOpenPrintPreview}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  title="Open certified vector print preview & PDF submittal engine"
                >
                  <Printer className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span className="hidden md:inline">Preview PDF</span>
                </button>

                {/* Save Calculation Snapshot Button */}
                <button
                  type="button"
                  onClick={handleLogCalculationSnapshot}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] hover:opacity-90 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                  title="Save verified analytical snapshot to History Ledger"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Log Snapshot</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Ribbon */}
            <PresetQuickBar
              activeModule={activeModule}
              presets={presets}
              onApplyPreset={handleApplyPreset}
              onOpenPresetsManager={() => handleOpenProfileModal('presets')}
              onSaveCurrentAsPreset={() => handleOpenProfileModal('presets')}
            />

            {/* Workflow Cross-Link Banner */}
            <div className="mx-4 md:mx-6 mt-4 no-print">
              <WorkflowCrossLinkBanner
                activeModule={activeModule}
                activeWorkspace={activeWorkspace}
                onTransferBbsToBoq={handleTransferBbsToBoq}
                onTransferMixToBoq={handleTransferMixToBoq}
                onTransferBearingToFootingAndPit={handleTransferBearingToFootingAndPit}
                onTransferBearingToPile={handleTransferBearingToPile}
                onTransferBeamToRebar={handleTransferBeamToRebar}
                onTransferContinuousBeamToRebar={handleTransferContinuousBeamToRebar}
                onTransferMixToMaterials={handleTransferMixToMaterials}
                onTransferMaterialsToBoq={handleTransferMaterialsToBoq}
                onTransferMasonryToBoq={handleTransferMasonryToBoq}
                onTransferPileToBoq={handleTransferPileToBoq}
                onTransferEarthworkToBoq={handleTransferEarthworkToBoq}
                onTransferPipeToBoq={handleTransferPipeToBoq}
                onApplyRateToBoq={handleApplyRateToBOQ}
                currencySymbol={getCurrencySymbol(activeWorkspace.currency)}
                bbsSteelWeightKg={crossLinkMetrics.bbsSteelWeightKg}
                beamMaxMomentKnm={crossLinkMetrics.beamMaxMomentKnm}
                masonryNetVolumeM3={crossLinkMetrics.masonryNetVolumeM3}
                masonryBricksCount={crossLinkMetrics.masonryBricksCount}
                pileConcreteVolumeM3={crossLinkMetrics.pileConcreteVolumeM3}
                earthworkBankVolumeM3={crossLinkMetrics.earthworkBankVolumeM3}
                rateAnalysisUnitRate={crossLinkMetrics.rateAnalysisUnitRate}
                continuousBeamMaxMomentKnm={crossLinkMetrics.continuousBeamMaxMomentKnm}
              />
            </div>

            {/* Dedicated Full-Width Module Views (Surveying Suite & Site Management ERP) */}
            {activeModule === 'surveying-suite' ? (
              <div className="p-4 md:p-6 space-y-6">
                <React.Suspense fallback={<ModuleSuspenseFallback title="Surveying & Land Measurement Suite" />}>
                  <SurveyingSuite
                    onQuickPrint={handleQuickPrintA4Report}
                    onExportPdf={handleDirectDownloadPdf}
                    onExportCsv={handleExportAnalyticalCsv}
                    onSaveToHistory={handleLogCalculationSnapshot}
                  />
                </React.Suspense>
              </div>
            ) : [
                'store-inventory',
                'material-requisition',
                'schedule-roster',
                'labor-attendance',
                'field-notebook',
                'contractor-bills',
                'petty-cash',
                'cube-tests',
                'daily-progress-report',
                'office-docs',
              ].includes(activeModule) ? (
              <React.Suspense fallback={<ModuleSuspenseFallback title={MODULE_META[activeModule]?.label || 'Site Management ERP'} />}>
                <SiteManagementHub
                  activeTab={activeModule}
                  onSelectTab={(tab) => navigateToModule(tab)}
                  onSaveToHistory={handleLogCalculationSnapshot}
                  onQuickPrint={handleQuickPrintA4Report}
                  onExportPdf={handleDirectDownloadPdf}
                  onExportCsv={handleExportAnalyticalCsv}
                  workspaceId={activeWorkspace.id}
                  projectName={activeWorkspace.name}
                  currency={activeWorkspace.currency}
                  activeWorkspace={activeWorkspace}
                />
              </React.Suspense>
            ) : (
              <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Parameter Input Form with Smooth Unit Transition */}
              <motion.section
                key={`inputs-pane-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.9, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="lg:col-span-5 space-y-4"
              >
                {/* MODULE: BOQ & QUANTITY TAKEOFF ESTIMATOR (Form State completely encapsulated) */}
                {activeModule === 'boq-estimator' && (
                  <BoqEstimatorInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    rateAnalysisResult={currentEnvelope.result as any}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                    editingTakeoffItemId={editingTakeoffItemId}
                    setEditingTakeoffItemId={setEditingTakeoffItemId}
                    onApplyRateToBOQ={handleApplyRateToBOQ}
                    onClearAllBOQItems={handleClearAllBOQItems}
                    onLoadSampleBOQItems={handleLoadSampleBOQItems}
                    onExportBOQCSV={handleExportBOQCSV}
                    onExportBOQPdf={handleExportBOQPdf}
                    isExportingPdf={isExportingBoqPdf}
                    userProfile={userProfile}
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

                {/* MODULE: SMART UNIT CONVERTER */}
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

                {/* MODULE: CONCRETE MATERIALS */}
                {activeModule === 'concrete-materials' && (
                  <ConcreteMaterialsInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: REBAR BBS */}
                {activeModule === 'rebar-bbs' && (
                  <RebarBbsInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: MASONRY & FINISHES */}
                {activeModule === 'masonry-finishes' && (
                  <MasonryFinishesInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: EARTHWORK & ALIGNMENT */}
                {activeModule === 'earthwork-alignment' && (
                  <EarthworkAlignmentInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: BEAM ANALYSIS */}
                {activeModule === 'beam-analysis' && (
                  <BeamAnalysisInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: BEARING CAPACITY */}
                {activeModule === 'bearing-capacity' && (
                  <BearingCapacityInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: CONCRETE MIX */}
                {activeModule === 'concrete-mix' && (
                  <ConcreteMixInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: OPEN-CHANNEL HYDRAULICS */}
                {activeModule === 'open-channel' && (
                  <OpenChannelInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    customUnits={appState.customUnits}
                    getFieldUnit={getFieldUnit}
                    updateFieldUnit={updateFieldUnit}
                  />
                )}

                {/* MODULE: CONTINUOUS BEAM */}
                {activeModule === 'continuous-beam' && (
                  <ContinuousBeamInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                  />
                )}

                {/* MODULE: PILE CAPACITY */}
                {activeModule === 'pile-capacity' && (
                  <PileCapacityInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                  />
                )}

                {/* MODULE: PIPE HYDRAULICS */}
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

              {/* Right Pane: Results, Engineering Diagrams & High-Density Tables */}
              <section className="lg:col-span-7 space-y-5">
                {/* DEMAND-CAPACITY RATIO (DCR) & LIMIT-STATE GAUGES */}
                {capacityGauges && capacityGauges.length > 0 && (
                  <DcrGaugeSuite
                    gauges={capacityGauges}
                    moduleKey={activeModule}
                  />
                )}

                {/* Interactive Analytical Engineering Diagram Container */}
                <div className="analytical-diagram-container rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-4 shadow-xs overflow-hidden">
                  <div className="flex items-center justify-between mb-3 border-b border-[var(--md-sys-color-outline-variant)] pb-2">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      <span>Parametric CAD Analytical Visualizer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] font-bold">
                        {MODULE_META[activeModule].codeStandard}
                      </span>
                    </div>
                  </div>

                  {activeModule === 'boq-estimator' && currentEnvelope.result && (
                    <BOQCostBreakdownDiagramSvg params={activeWorkspace.boq} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'rate-analysis' && currentEnvelope.result && (
                    <RateAnalysisBreakdownDiagramSvg params={activeWorkspace.rateAnalysis} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'unit-converter' && (
                    <UnitConverterDiagramSvg
                      inputVal={activeWorkspace.converter.inputValue}
                      outputVal={activeConversionResult?.result ?? 0}
                      fromUnit={activeWorkspace.converter.fromUnit}
                      toUnit={activeWorkspace.converter.toUnit}
                      category={activeWorkspace.converter.category}
                    />
                  )}
                  {activeModule === 'concrete-materials' && currentEnvelope.result && (
                    <ConcreteMaterialsDiagramSvg params={activeWorkspace.concreteMaterials} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'rebar-bbs' && currentEnvelope.result && (
                    <RebarBBSDiagramSvg params={activeWorkspace.rebarBbs} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'masonry-finishes' && currentEnvelope.result && (
                    <MasonryDiagramSvg params={activeWorkspace.masonry} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'earthwork-alignment' && currentEnvelope.result && (
                    <EarthworkDiagramSvg params={activeWorkspace.earthwork} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'beam-analysis' && currentEnvelope.result && (
                    <BeamDiagramSvg params={activeWorkspace.beam} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'bearing-capacity' && currentEnvelope.result && (
                    <BearingDiagramSvg params={activeWorkspace.bearing} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'concrete-mix' && currentEnvelope.result && (
                    <ConcreteMixSvg params={activeWorkspace.concrete} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'open-channel' && currentEnvelope.result && (
                    <ChannelHydraulicsSvg params={activeWorkspace.channel} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'continuous-beam' && currentEnvelope.result && (
                    <ContinuousBeamDiagramSvg params={activeWorkspace.continuousBeam || defaultContinuousBeam} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'pile-capacity' && currentEnvelope.result && (
                    <PileCapacityDiagramSvg params={activeWorkspace.pile || defaultPile} result={currentEnvelope.result as any} />
                  )}
                  {activeModule === 'pipe-hydraulics' && currentEnvelope.result && (
                    <PipeHydraulicsDiagramSvg params={activeWorkspace.pipe || defaultPipe} result={currentEnvelope.result as any} />
                  )}
                </div>

                {/* Analytical Dense Table Suite */}
                <div className="analytical-dense-table-container rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-4 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
                    <div>
                      <h2 className="text-sm font-bold font-sans tracking-tight text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                        <Table className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                        <span>{MODULE_META[activeModule].label} · Calculation Schedule (A4 Print-Ready)</span>
                      </h2>
                      <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                        Governing Standard: <strong className="text-[var(--md-sys-color-primary)]">{MODULE_META[activeModule].codeStandard}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopySummary}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy summarized engineering metrics with DCR to clipboard"
                      >
                        {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSummary ? 'Copied' : 'Copy Submittal'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportAnalyticalCsv}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--md-sys-color-surface-container-highest)] hover:opacity-90 text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 border border-[var(--md-sys-color-outline-variant)] cursor-pointer"
                        title="Export calculation schedule to Excel CSV with UTF-8 BOM"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV Export</span>
                      </button>
                    </div>
                  </div>

                  <AnalyticalDenseTable
                    activeModule={activeModule}
                    activeWorkspace={activeWorkspace}
                    currentEnvelope={currentEnvelope}
                    isCompact={isTableCompact}
                    searchQuery={denseTableSearch}
                  />
                </div>

                {/* Dynamic Metrics Cards (Lazy Rendered based on Active Module) */}
                {activeModule === 'concrete-materials' && currentEnvelope.result && (
                  <ConcreteMaterialsMetrics
                    result={currentEnvelope.result as any}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'beam-analysis' && currentEnvelope.result && (
                  <BeamAnalysisMetrics
                    result={currentEnvelope.result as any}
                    activeWorkspace={activeWorkspace}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'bearing-capacity' && currentEnvelope.result && (
                  <BearingCapacityMetrics
                    result={currentEnvelope.result as any}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'rebar-bbs' && currentEnvelope.result && (
                  <RebarBbsMetrics
                    result={currentEnvelope.result as any}
                    activeWorkspace={activeWorkspace}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'unit-converter' && activeConversionResult && (
                  <UnitConverterMetrics
                    inputValue={activeWorkspace.converter.inputValue}
                    fromUnit={activeWorkspace.converter.fromUnit}
                    toUnit={activeWorkspace.converter.toUnit}
                    category={activeWorkspace.converter.category}
                    conversionResult={activeConversionResult}
                    customUnits={appState.customUnits}
                    onOpenCustomUnitsModal={() => setCustomUnitModalOpen(true)}
                  />
                )}
                {activeModule === 'masonry-finishes' && currentEnvelope.result && (
                  <MasonryFinishesMetrics
                    result={currentEnvelope.result as any}
                    activeWorkspace={activeWorkspace}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'earthwork-alignment' && currentEnvelope.result && (
                  <EarthworkAlignmentMetrics
                    result={currentEnvelope.result as any}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'concrete-mix' && currentEnvelope.result && (
                  <ConcreteMixMetrics
                    result={currentEnvelope.result as any}
                    activeWorkspace={activeWorkspace}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'open-channel' && currentEnvelope.result && (
                  <OpenChannelMetrics
                    result={currentEnvelope.result as any}
                    customUnits={appState.customUnits}
                    getOutputUnit={getOutputUnit}
                    updateOutputUnit={updateOutputUnit}
                  />
                )}
                {activeModule === 'continuous-beam' && currentEnvelope.result && (
                  <ContinuousBeamMetrics
                    result={currentEnvelope.result as any}
                  />
                )}
                {activeModule === 'pile-capacity' && currentEnvelope.result && (
                  <PileCapacityMetrics
                    result={currentEnvelope.result as any}
                  />
                )}
                {activeModule === 'pipe-hydraulics' && currentEnvelope.result && (
                  <PipeHydraulicsMetrics
                    result={currentEnvelope.result as any}
                  />
                )}

                {/* CONCRETE MIX DESIGN VOLUME BATCH TABLE */}
                {activeModule === 'concrete-mix' && currentEnvelope.result && (
                  <ConcreteMixVolumeTable
                    result={currentEnvelope.result as any}
                    activeWorkspace={activeWorkspace}
                  />
                )}

                {/* DYNAMIC MEASUREMENT SHEET (L x W x H) & BOQ SPREADSHEET TABLE */}
                {activeModule === 'boq-estimator' && currentEnvelope.result && (
                  <BoqEstimatorTable
                    boqResult={currentEnvelope.result as any}
                    filteredBOQItems={filteredBOQItems}
                    boqCategoryFilter={boqCategoryFilter}
                    setBoqCategoryFilter={setBoqCategoryFilter}
                    onEditTakeoffItem={(item) => setEditingTakeoffItemId(item.id)}
                    onDuplicateTakeoffItem={handleDuplicateTakeoffItem}
                    onDeleteTakeoffItem={handleDeleteTakeoffItem}
                    onLoadSampleBOQItems={handleLoadSampleBOQItems}
                    onSyncFromModules={handleSyncAllModulesToBoq}
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    userProfile={userProfile}
                  />
                )}

                {/* RATE ANALYSIS COMPOSITE BREAKDOWN TABLES */}
                {activeModule === 'rate-analysis' && currentEnvelope.result && (
                  <RateAnalysisTables
                    rateResult={currentEnvelope.result as any}
                    onApplyRateToBOQ={handleApplyRateToBOQ}
                  />
                )}
              </section>
            </div>
            )}
            </>
            )}

            {/* Application Master Footer */}
            <Footer
              onNavigateHome={() => navigateToDashboard('home')}
              className="mt-12 no-print"
            />
          </main>
        </div>

        {/* FLOATING COLLAPSIBLE & ORIENTATION-ADAPTIVE BOTTOM DOCK */}
        <FloatingBottomDock
          onNavigateHome={() => navigateToDashboard('home')}
          onNavigateAll={() => navigateToDashboard('all')}
          onOpenSearch={() => navigateToDashboard('search')}
          onNavigateConverter={() => navigateToModule('unit-converter')}
          onOpenHistory={() => navigateToDashboard('history')}
          onOpenProfile={() => navigateToDashboard('profile')}
        />

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
          onDeleteWorkspace={(id) => handleDeleteWorkspace(id)}
          onImportProjectJson={() => projectFileInputRef.current?.click()}
          onLoadDemoProject={handleAddDemoProject}
          onExportAllProjects={handleExportStateJson}
        />

        {/* EDIT WORKSPACE METADATA MODAL */}
        <EditWorkspaceModal
          isOpen={Boolean(editingWorkspace)}
          onClose={() => setEditingWorkspace(null)}
          workspace={editingWorkspace}
          onSaveWorkspace={handleSaveEditWorkspace}
        />

        {/* CREATE NEW WORKSPACE MODAL */}
        <NewWorkspaceModal
          isOpen={newWorkspaceOpen}
          onClose={() => setNewWorkspaceOpen(false)}
          onCreateWorkspace={handleCreateWorkspace}
          activeWorkspaceItemCount={activeWorkspace.boq.items.length}
        />

        {/* CUSTOM UNIT MANAGER MODAL */}
        <CustomUnitModal
          isOpen={customUnitModalOpen}
          onClose={() => setCustomUnitModalOpen(false)}
          customUnits={appState.customUnits}
          onCreateUnit={handleCreateCustomUnit}
          onDeleteUnit={handleDeleteCustomUnit}
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

        {/* Professional Print Preview & Flawless Vector PDF Engine Modal (Lazy Suspense) */}
        <React.Suspense fallback={<ModalSuspenseFallback isOpen={printPreviewModalOpen} />}>
          {printPreviewModalOpen && (
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
          )}
        </React.Suspense>

        {/* Real-time PDF Export Multi-Stage Progress Modal HUD */}
        <PdfExportProgressModal
          progress={pdfExportProgress}
          moduleName={MODULE_META[activeModule]?.label || 'Certified Engineering Submittal'}
          projectCode={activeWorkspace.projectCode}
        />

        {/* Engineering Submittal Verification Modal */}
        <VerifySubmittalModal
          isOpen={verifySubmittalModalOpen}
          onClose={() => setVerifySubmittalModalOpen(false)}
          onSelectRecord={(rec) => {
            setVerifiedReportRecord(rec);
          }}
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

        {/* Architecture & By-Laws Interactive Modal (Lazy Suspense) */}
        <React.Suspense fallback={<ModalSuspenseFallback isOpen={architectureModalOpen} />}>
          {architectureModalOpen && (
            <ArchitectureByLawsModal
              isOpen={architectureModalOpen}
              onClose={() => setArchitectureModalOpen(false)}
              initialTab={architectureInitialTab}
              architecture={activeWorkspace.architecture}
              onUpdateArchitecture={(updater) => {
                updateActiveWorkspace((ws) => {
                  const prevArch = ws.architecture || createDefaultArchitectureParameters();
                  const nextArch = updater(prevArch);
                  return { ...ws, architecture: nextArch };
                });
              }}
              onSendTankToBOQ={(tankItems) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  boq: {
                    ...ws.boq,
                    items: [...ws.boq.items, ...tankItems],
                  },
                }));
                triggerCelebration(
                  'Tank Quantities Added to BOQ',
                  `Added ${tankItems.length} line items for Water Reservoirs (UGWR & OHT) & Septic Tank to Quantity Takeoff.`,
                  'success'
                );
              }}
              onSendStaircaseToRebar={(stairParams) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  activeModule: 'rebar-bbs',
                  rebarBbs: {
                    ...ws.rebarBbs,
                    elementType: 'staircase-waist',
                    ...stairParams,
                  },
                }));
                navigateToModule('rebar-bbs', 'staircase');
                setArchitectureModalOpen(false);
                triggerCelebration(
                  'Staircase Sent to Rebar BBS',
                  'Transferred staircase waist slab geometry & riser/tread parameters directly into Rebar Bar Bending Schedule.',
                  'success'
                );
              }}
            />
          )}
        </React.Suspense>

        {/* AutoCAD Scale & Viewport Calculator, CAD Shortcuts & LISP Hub Modal (Lazy Suspense) */}
        <React.Suspense fallback={<ModalSuspenseFallback isOpen={cadModalOpen} />}>
          {cadModalOpen && (
            <CadUtilitiesModal
              isOpen={cadModalOpen}
              onClose={() => setCadModalOpen(false)}
              initialTab={cadInitialTab}
            />
          )}
        </React.Suspense>

        {/* Construction QA/QC & Pre-Pour Inspection Checklists Modal */}
        <SiteQcModal
          isOpen={siteQcModalOpen}
          onClose={() => setSiteQcModalOpen(false)}
        />

        {/* Quick Engineering Monograph & "About This Tool" Drawer */}
        <AboutThisToolDrawer
          toolId={activeModule}
          isOpen={aboutToolDrawerOpen}
          onClose={() => setAboutToolDrawerOpen(false)}
        />

        {/* TWO-STAGE PDF EXPORT PRESET & PRE-DOWNLOAD SETUP MODAL (Lazy Suspense) */}
        <React.Suspense fallback={<ModalSuspenseFallback isOpen={isPdfExportModalOpen} />}>
          {isPdfExportModalOpen && (
            <PdfExportModal
              isOpen={isPdfExportModalOpen}
              onClose={() => setIsPdfExportModalOpen(false)}
              activeWorkspace={activeWorkspace}
              activeModule={activeModule}
              envelope={currentEnvelope}
              moduleLabel={MODULE_META[activeModule]?.label}
              codeStandard={MODULE_META[activeModule]?.codeStandard}
              onComplete={() => {
                triggerCelebration(
                  'PDF Exported Successfully',
                  `Certified submittal downloaded for ${MODULE_META[activeModule]?.shortLabel || activeModule}`,
                  'celebrate'
                );
              }}
            />
          )}
        </React.Suspense>

        {/* Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectModule={navigateToModule}
          recentQueries={appState.commandRecentQueries}
          onAddRecentQuery={handleAddRecentQuery}
          onOpenProfile={() => handleOpenProfileModal('profile')}
          onOpenPreferences={() => handleOpenProfileModal('preferences')}
          onOpenPresets={() => handleOpenProfileModal('presets')}
          onOpenPrintPreview={handleOpenPrintPreview}
          onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
          onQuickPrint={handleQuickPrintA4Report}
          onExportPdf={handleDirectDownloadPdf}
          onOpenArchitectureModal={(tab) => {
            if (tab) setArchitectureInitialTab(tab);
            setArchitectureModalOpen(true);
          }}
          onOpenCadModal={(tab) => {
            if (tab) setCadInitialTab(tab);
            setCadModalOpen(true);
          }}
          onOpenSiteQcModal={() => setSiteQcModalOpen(true)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          savedCalculations={appState.calculationHistory}
          boqItems={activeWorkspace.boq.items}
        />
      </div>
      )}

      {/* Isolated root-level container for pristine vector print / PDF execution (never clipped by screen layout) */}
      <div id="pb-printable-report" className="hidden print:block bg-white text-slate-900 m-0 p-0 font-sans"></div>
    </ErrorBoundary>
  );
}
