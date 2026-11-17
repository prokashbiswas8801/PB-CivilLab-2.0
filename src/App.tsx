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
  MoreVertical,
  Info,
  BookOpenCheck,
  Share2,
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
  ArchitectureTab,
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
  ValidationIssue,
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
  createDefaultFrameTruss2D,
  createDefaultSectionAnalyzer,
  createDefaultRcColumnDesign,
  createDefaultStrutAndTie,
  createDefaultContinuousBeam,
  createDefaultPileCapacity,
  createDefaultPipeHydraulics,
  createDefaultMasterMarketRates,
  createDefaultTestingLabState,
} from './utils/storage';
import { TestingLabDomainId } from './types/testingLab';
import { getTestsForDomain, TESTING_LAB_TEST_MAP, TESTING_LAB_TESTS } from './data/testingLabCatalog';
import {
  evaluateLabTest,
  getDefaultInputsForTest,
  getDefaultChecklistStates,
} from './utils/testingLabEngine';
import { getIndexedDBStats, isIndexedDBSupported, persistToIndexedDB } from './utils/indexedStorage';
import { computeFrameTruss2D, FrameTruss2DResult } from './utils/frameSolver2d';
import { computeSectionMechanics, SectionAnalyzerResult } from './utils/sectionMechanics';
import { computeRcColumnDesign, RcColumnDesignResult } from './utils/rcColumnEngine';
import { computeStrutAndTie, StrutAndTieResult } from './utils/strutAndTieEngine';
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
  EarthworkResult,
  RateAnalysisResult,
  ConcreteMaterialResult,
  BOQResourceAbstract,
} from './utils/calculations';
import {
  convertUnitValue,
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
  BOQCostBreakdownDiagramSvg,
  RateAnalysisBreakdownDiagramSvg,
  ContinuousBeamDiagramSvg,
  FrameTruss2DDiagramSvg,
  SectionAnalyzerDiagramSvg,
  RcColumnDiagramSvg,
  StrutAndTieDiagramSvg,
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
import { ConcreteGrade, MaterialUnit, RequisitionItem } from './types/siteManagement';
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
  FrameTruss2DInputs,
  FrameTruss2DMetrics,
  SectionAnalyzerInputs,
  SectionAnalyzerMetrics,
  RcColumnInputs,
  RcColumnMetrics,
  StrutAndTieInputs,
  StrutAndTieMetrics,
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
import { StepByStepPanel } from './components/StepByStepPanel';
import {
  BEAM_WORKED_EXAMPLES,
  CONTINUOUS_BEAM_WORKED_EXAMPLES,
  RATE_ANALYSIS_WORKED_EXAMPLES,
  BOQ_ESTIMATOR_WORKED_EXAMPLES,
  CONCRETE_MATERIALS_WORKED_EXAMPLES,
  REBAR_BBS_WORKED_EXAMPLES,
  MASONRY_WORKED_EXAMPLES,
  EARTHWORK_WORKED_EXAMPLES,
  BEARING_WORKED_EXAMPLES,
  PILE_WORKED_EXAMPLES,
  CONCRETE_MIX_WORKED_EXAMPLES,
  OPEN_CHANNEL_WORKED_EXAMPLES,
  PIPE_HYDRAULICS_WORKED_EXAMPLES,
  FRAME_TRUSS_WORKED_EXAMPLES,
  SECTION_ANALYZER_WORKED_EXAMPLES,
  RC_COLUMN_WORKED_EXAMPLES,
  STRUT_AND_TIE_WORKED_EXAMPLES,
  ALL_WORKED_EXAMPLES,
  parseStructuralDeepLink,
  buildWorkedExampleUrl,
  WorkedExampleEntry,
  DeepLinkModuleId,
} from './data/workedExamples';

// Dynamic Lazy Imports for Heavy Module Views & Modals
const SiteManagementHub = React.lazy(() =>
  import('./components/sitemanagement').then((m) => ({ default: m.SiteManagementHub }))
);
const TestingLabHub = React.lazy(() =>
  import('./components/testinglab').then((m) => ({ default: m.TestingLabHub }))
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
  const { siteData, financialSummary, updateInventoryItem, addInventoryItem, addCubeTestRecord, createRequisition } = useSiteManagement();
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
    { id: 'dashboard', type: 'dashboard', title: 'Home' },
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
  const [analyticalViewMode, setAnalyticalViewMode] = useState<'graphical' | 'tabular' | 'steps' | 'both'>('graphical');
  const [isTableCompact, setIsTableCompact] = useState(false);
  const [denseTableSearch, setDenseTableSearch] = useState('');
  const [showGoverningEquations, setShowGoverningEquations] = useState(false);
  const [exportToolsMenuOpen, setExportToolsMenuOpen] = useState(false);
  const exportToolsRef = useRef<HTMLDivElement>(null);
  const [workedExamplesMenuOpen, setWorkedExamplesMenuOpen] = useState(false);
  const workedExamplesRef = useRef<HTMLDivElement>(null);
  const [pendingDeepLinkOverwrite, setPendingDeepLinkOverwrite] = useState<{
    title: string;
    subtitle: string;
    onConfirm: () => void;
  } | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [activeReportQr, setActiveReportQr] = useState<GeneratedReportQrResult | null>(null);
  const [verifiedReportRecord, setVerifiedReportRecord] = useState<PublicEngineeringReportRecord | null>(null);
  const [verifiedOfficeDocRecord, setVerifiedOfficeDocRecord] = useState<VerifiedOfficeDocRecord | null>(null);
  const [verifySubmittalModalOpen, setVerifySubmittalModalOpen] = useState(false);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [architectureInitialTab, setArchitectureInitialTab] = useState<ArchitectureTab>('far');
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

      // 3. Structural Worked Example & Parameter URL Deep-Linking (?module=...&example=...&q=...)
      const deepLink = parseStructuralDeepLink(search);
      if (deepLink) {
        const matchedExample = deepLink.exampleId
          ? ALL_WORKED_EXAMPLES.find((ex) => ex.id === deepLink.exampleId)
          : undefined;
        const targetMod: DeepLinkModuleId =
          deepLink.module || matchedExample?.module || 'beam-analysis';

        const applyDeepLinkPayload = () => {
          setUndoStack((u) => [...u.slice(-19), activeWorkspace]);
          setRedoStack([]);
          updateActiveWorkspace((ws) => {
            if (targetMod === 'beam-analysis') {
              const baseBeam = matchedExample?.module === 'beam-analysis'
                ? { ...ws.beam, ...matchedExample.params }
                : { ...ws.beam };
              return {
                ...ws,
                activeModule: 'beam-analysis',
                beam: {
                  ...baseBeam,
                  ...(deepLink.overrides.L !== undefined ? { spanLengthM: deepLink.overrides.L } : {}),
                  ...(deepLink.overrides.q !== undefined ? { uniformLoadKnPerM: deepLink.overrides.q } : {}),
                  ...(deepLink.overrides.P !== undefined ? { pointLoadKn: deepLink.overrides.P } : {}),
                  ...(deepLink.overrides.a !== undefined ? { pointLoadPositionM: deepLink.overrides.a } : {}),
                },
              };
            }
            if (targetMod === 'rate-analysis') {
              return {
                ...ws,
                activeModule: 'rate-analysis',
                rateAnalysis: matchedExample?.module === 'rate-analysis'
                  ? { ...ws.rateAnalysis, ...matchedExample.params }
                  : ws.rateAnalysis,
                ...(matchedExample?.module === 'rate-analysis' && matchedExample.marketRates
                  ? { marketRates: { ...(ws.marketRates || createDefaultMasterMarketRates()), ...matchedExample.marketRates } }
                  : {}),
              };
            }
            if (targetMod === 'boq-estimator') {
              return {
                ...ws,
                activeModule: 'boq-estimator',
                boq: matchedExample?.module === 'boq-estimator'
                  ? { ...ws.boq, ...matchedExample.params }
                  : ws.boq,
              };
            }
            if (targetMod === 'concrete-materials') {
              return {
                ...ws,
                activeModule: 'concrete-materials',
                concreteMaterials: matchedExample?.module === 'concrete-materials'
                  ? { ...ws.concreteMaterials, ...matchedExample.params }
                  : ws.concreteMaterials,
              };
            }
            if (targetMod === 'rebar-bbs') {
              return {
                ...ws,
                activeModule: 'rebar-bbs',
                rebarBbs: matchedExample?.module === 'rebar-bbs'
                  ? { ...ws.rebarBbs, ...matchedExample.params }
                  : ws.rebarBbs,
              };
            }
            if (targetMod === 'masonry-finishes') {
              return {
                ...ws,
                activeModule: 'masonry-finishes',
                masonry: matchedExample?.module === 'masonry-finishes'
                  ? { ...ws.masonry, ...matchedExample.params }
                  : ws.masonry,
              };
            }
            if (targetMod === 'earthwork-alignment') {
              return {
                ...ws,
                activeModule: 'earthwork-alignment',
                earthwork: matchedExample?.module === 'earthwork-alignment'
                  ? { ...ws.earthwork, ...matchedExample.params }
                  : ws.earthwork,
              };
            }
            if (targetMod === 'bearing-capacity') {
              return {
                ...ws,
                activeModule: 'bearing-capacity',
                bearing: matchedExample?.module === 'bearing-capacity'
                  ? { ...ws.bearing, ...matchedExample.params }
                  : ws.bearing,
              };
            }
            if (targetMod === 'pile-capacity') {
              return {
                ...ws,
                activeModule: 'pile-capacity',
                pile: matchedExample?.module === 'pile-capacity'
                  ? { ...(ws.pile || createDefaultPileCapacity()), ...matchedExample.params }
                  : ws.pile || createDefaultPileCapacity(),
              };
            }
            if (targetMod === 'concrete-mix') {
              return {
                ...ws,
                activeModule: 'concrete-mix',
                concrete: matchedExample?.module === 'concrete-mix'
                  ? { ...ws.concrete, ...matchedExample.params }
                  : ws.concrete,
              };
            }
            if (targetMod === 'open-channel') {
              return {
                ...ws,
                activeModule: 'open-channel',
                channel: matchedExample?.module === 'open-channel'
                  ? { ...ws.channel, ...matchedExample.params }
                  : ws.channel,
              };
            }
            if (targetMod === 'pipe-hydraulics') {
              return {
                ...ws,
                activeModule: 'pipe-hydraulics',
                pipe: matchedExample?.module === 'pipe-hydraulics'
                  ? { ...(ws.pipe || createDefaultPipeHydraulics()), ...matchedExample.params }
                  : ws.pipe || createDefaultPipeHydraulics(),
              };
            }
            if (targetMod === 'frame-truss-2d') {
              return {
                ...ws,
                activeModule: 'frame-truss-2d',
                frameTruss2d: matchedExample?.module === 'frame-truss-2d'
                  ? matchedExample.params
                  : ws.frameTruss2d || createDefaultFrameTruss2D(),
              };
            }
            if (targetMod === 'section-analyzer') {
              return {
                ...ws,
                activeModule: 'section-analyzer',
                sectionAnalyzer: matchedExample?.module === 'section-analyzer'
                  ? { ...(ws.sectionAnalyzer || createDefaultSectionAnalyzer()), ...matchedExample.params }
                  : ws.sectionAnalyzer || createDefaultSectionAnalyzer(),
              };
            }
            if (targetMod === 'rc-column-design') {
              return {
                ...ws,
                activeModule: 'rc-column-design',
                rcColumn: matchedExample?.module === 'rc-column-design'
                  ? { ...(ws.rcColumn || createDefaultRcColumnDesign()), ...matchedExample.params }
                  : ws.rcColumn || createDefaultRcColumnDesign(),
              };
            }
            if (targetMod === 'strut-and-tie') {
              return {
                ...ws,
                activeModule: 'strut-and-tie',
                strutAndTie: matchedExample?.module === 'strut-and-tie'
                  ? { ...(ws.strutAndTie || createDefaultStrutAndTie()), ...matchedExample.params }
                  : ws.strutAndTie || createDefaultStrutAndTie(),
              };
            }
            const baseCb = matchedExample?.module === 'continuous-beam'
              ? matchedExample.params
              : ws.continuousBeam || defaultContinuousBeam;
            return {
              ...ws,
              activeModule: 'continuous-beam',
              continuousBeam: baseCb,
            };
          });
          setIsDashboardView(false);
          setActiveTabId(`tab-${targetMod}`);
          setOpenTabs((prev) =>
            prev.some((t) => t.moduleId === targetMod)
              ? prev
              : [
                  ...prev,
                  {
                    id: `tab-${targetMod}`,
                    type: 'module',
                    moduleId: targetMod,
                    title: MODULE_META[targetMod]?.shortLabel || targetMod,
                    shortCode: TOOL_REGISTRY_MAP[targetMod]?.shortCode,
                  },
                ]
          );
          civilLab.setActivePage('calculator', targetMod);
          setShowSplash(false);
          triggerCelebration(
            matchedExample ? `Loaded: ${matchedExample.title}` : 'URL Parameters Applied',
            'Structural model synchronized from shareable URL',
            'celebrate'
          );
        };

        const hasUserModifiedData =
          targetMod === 'beam-analysis'
            ? activeWorkspace.beam.spanLengthM > 0 ||
              activeWorkspace.beam.uniformLoadKnPerM > 0 ||
              activeWorkspace.beam.pointLoadKn > 0
            : targetMod === 'concrete-materials'
              ? (activeWorkspace.concreteMaterials.wetVolumeM3 || 0) > 0 ||
                Boolean(activeWorkspace.concreteMaterials.members && activeWorkspace.concreteMaterials.members.length > 0)
              : targetMod === 'rebar-bbs'
                ? (activeWorkspace.rebarBbs.slabLengthM || 0) > 0 ||
                  (activeWorkspace.rebarBbs.colHeightM || 0) > 0 ||
                  (activeWorkspace.rebarBbs.footingLengthM || 0) > 0
                : targetMod === 'masonry-finishes'
                  ? (activeWorkspace.masonry.wallLengthM || 0) > 0
                  : targetMod === 'earthwork-alignment'
                    ? (activeWorkspace.earthwork.roadLengthM || 0) > 0 ||
                      (activeWorkspace.earthwork.pitTopLengthM || 0) > 0 ||
                      Boolean(activeWorkspace.earthwork.chainageStations && activeWorkspace.earthwork.chainageStations.length > 0)
                    : Boolean(
                        activeWorkspace.continuousBeam &&
                          activeWorkspace.continuousBeam.spans.some((s) => s.lengthM > 0 && s.udlKnPerM > 0)
                      );

        if (hasUserModifiedData) {
          setShowSplash(false);
          setPendingDeepLinkOverwrite({
            title: matchedExample ? matchedExample.title : `Custom ${MODULE_META[targetMod].label} URL`,
            subtitle: matchedExample
              ? matchedExample.subtitle
              : `Apply URL parameters to ${MODULE_META[targetMod].label}?`,
            onConfirm: applyDeepLinkPayload,
          });
        } else {
          applyDeepLinkPayload();
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

  const prevSyncedProfileNameRef = useRef<string>(
    typeof appState.userProfile?.fullName === 'string' ? appState.userProfile.fullName.trim() : ''
  );

  // Synchronize CivilLabContext.userProfile (edited in ProfilePage) into appState.userProfile & all related workspaces' engineerOfRecord
  useEffect(() => {
    const cp = civilLab?.userProfile;
    if (!cp || typeof cp !== 'object') return;

    const sanitizeProfileField = (val: unknown): string => {
      if (typeof val !== 'string') return '';
      const cleaned = val.trim().replace(/\s+/g, ' ');
      return cleaned === 'undefined' || cleaned === 'null' ? '' : cleaned;
    };

    const nextFullName = sanitizeProfileField(cp.name);
    const nextTitle = sanitizeProfileField(cp.title);
    const nextOrg = sanitizeProfileField(cp.organization);
    const nextLic = sanitizeProfileField(cp.licenseNo);
    const nextEmail = typeof cp.email === 'string' ? cp.email.trim() : '';
    const nextPhone = sanitizeProfileField(cp.phone);
    const nextAddress = sanitizeProfileField(cp.location);
    const isProfileCleared =
      !nextFullName && !nextTitle && !nextOrg && !nextLic && !nextEmail && !nextPhone && !nextAddress;
    const isNameCleared = nextFullName.length === 0;

    const nextInitials = nextFullName
      ? nextFullName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || '')
          .join('')
      : '';

    const syncTimestamp = new Date().toISOString();

    setAppState((prev) => {
      const cur = prev.userProfile || createDefaultUserProfile();
      const prevProfileName = typeof cur.fullName === 'string' ? cur.fullName.trim() : '';

      const sameProfile =
        cur.fullName === nextFullName &&
        cur.designation === nextTitle &&
        cur.organization === nextOrg &&
        (cur.licenseNumber || '') === nextLic &&
        (cur.email || '') === nextEmail &&
        (cur.phone || '') === nextPhone &&
        (cur.address || '') === nextAddress &&
        (!isNameCleared || !cur.initials);

      const currentWorkspaces = Array.isArray(prev.workspaces) ? prev.workspaces : [];
      let workspacesChanged = false;

      const updatedWorkspaces = currentWorkspaces.map((ws) => {
        const rawEor = typeof ws.engineerOfRecord === 'string' ? ws.engineerOfRecord : '';
        const currentEor = rawEor.trim();
        const isActiveWs = ws.id === prev.activeWorkspaceId;
        const matchesPrevProfile = prevProfileName.length > 0 && currentEor === prevProfileName;
        const isOrphanedPreseeded =
          isNameCleared && /prokash\s*biswas|lead structural engineer/i.test(currentEor);
        const isBlankOrWhitespace = currentEor.length === 0;
        const isRelatedWorkspace =
          isActiveWs || matchesPrevProfile || isOrphanedPreseeded || isBlankOrWhitespace;

        if (!isRelatedWorkspace) {
          return ws;
        }

        const targetEor = isNameCleared || isProfileCleared ? '' : nextFullName;
        if (rawEor !== targetEor) {
          workspacesChanged = true;
          return {
            ...ws,
            engineerOfRecord: targetEor,
            updatedAt: syncTimestamp,
          };
        }
        return ws;
      });

      if (sameProfile && !workspacesChanged) {
        return prev;
      }

      const resolvedInitials = nextFullName
        ? prevProfileName === nextFullName && cur.initials
          ? cur.initials
          : nextInitials
        : '';

      return {
        ...prev,
        userProfile: {
          ...cur,
          fullName: nextFullName,
          designation: nextTitle,
          organization: nextOrg,
          licenseNumber: nextLic,
          email: nextEmail,
          phone: nextPhone,
          address: nextAddress,
          initials: resolvedInitials,
        },
        workspaces: updatedWorkspaces,
      };
    });

    const prevSyncedName = prevSyncedProfileNameRef.current;
    const wbEng =
      typeof workbench.projectMetadata?.engineerName === 'string'
        ? workbench.projectMetadata.engineerName.trim()
        : '';

    if (isNameCleared || isProfileCleared) {
      if (
        wbEng !== '' &&
        (wbEng === prevSyncedName || /prokash\s*biswas|lead structural engineer/i.test(wbEng))
      ) {
        workbench.updateProjectMetadata({ engineerName: '' });
      }
    } else if (
      wbEng === '' ||
      (prevSyncedName.length > 0 && wbEng === prevSyncedName)
    ) {
      if (wbEng !== nextFullName) {
        workbench.updateProjectMetadata({ engineerName: nextFullName });
      }
    }

    prevSyncedProfileNameRef.current = nextFullName;
  }, [
    civilLab.userProfile.name,
    civilLab.userProfile.title,
    civilLab.userProfile.organization,
    civilLab.userProfile.licenseNo,
    civilLab.userProfile.email,
    civilLab.userProfile.phone,
    civilLab.userProfile.location,
  ]);

  const userPreferences: UserCustomPreferences = useMemo(
    () => appState.userPreferences || createDefaultUserPreferences(),
    [appState.userPreferences]
  );

  const presets: EngineeringPreset[] = useMemo(
    () => appState.presets || createDefaultEngineeringPresets(),
    [appState.presets]
  );

  const activeModule = activeWorkspace.activeModule;

  // Synchronize initial persisted CivilLab page state with openTabs / isDashboardView on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      if (
        urlParams.get('verify') ||
        urlParams.get('token') ||
        urlParams.get('docToken') ||
        urlParams.get('verifyDoc') ||
        parseStructuralDeepLink(window.location.search)
      ) {
        return;
      }
    }

    if (civilLab.activePage === 'calculator' || civilLab.activePage === 'converter') {
      const targetMod: EngineeringModuleId =
        civilLab.activePage === 'converter'
          ? 'unit-converter'
          : ((civilLab.activeCalculatorId as EngineeringModuleId) || activeWorkspace.activeModule);
      if (targetMod && MODULE_META[targetMod]) {
        setIsDashboardView(false);
        const tabId = `tab-${targetMod}`;
        setOpenTabs((prev) => {
          const existing = prev.find((t) => t.id === tabId || t.moduleId === targetMod);
          if (existing) {
            setActiveTabId(existing.id);
            return prev;
          }
          const toolMeta = TOOL_REGISTRY_MAP[targetMod];
          setActiveTabId(tabId);
          return [
            ...prev,
            {
              id: tabId,
              type: 'module',
              moduleId: targetMod,
              title: toolMeta?.shortLabel || MODULE_META[targetMod]?.shortLabel || targetMod,
              shortCode: toolMeta?.shortCode,
            },
          ];
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep browser document.title aligned with active view ('Home' when on Home view)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (verifiedOfficeDocRecord) {
      document.title = 'Verified Document — BD. CivilLab';
      return;
    }
    if (verifiedReportRecord) {
      document.title = 'Verified Report — BD. CivilLab';
      return;
    }
    if (
      civilLab.activePage === 'home' ||
      (isDashboardView &&
        !['all', 'search', 'converter', 'history', 'profile', 'calculator'].includes(civilLab.activePage))
    ) {
      document.title = 'Home — BD. CivilLab';
    } else if (civilLab.activePage === 'all') {
      document.title = 'All Tools — BD. CivilLab';
    } else if (civilLab.activePage === 'search') {
      document.title = 'Search — BD. CivilLab';
    } else if (civilLab.activePage === 'history') {
      document.title = 'History — BD. CivilLab';
    } else if (civilLab.activePage === 'profile') {
      document.title = 'Profile — BD. CivilLab';
    } else {
      const modTitle =
        TOOL_REGISTRY_MAP[activeModule]?.shortLabel || MODULE_META[activeModule]?.shortLabel || 'Workbench';
      document.title = `${modTitle} — BD. CivilLab`;
    }
  }, [civilLab.activePage, isDashboardView, activeModule, verifiedOfficeDocRecord, verifiedReportRecord]);

  // Active Unit Converter Computation
  const activeConversionResult = useMemo(() => {
    if (activeModule !== 'unit-converter') return undefined;
    return convertUnitValue(
      activeWorkspace.converter.inputValue,
      activeWorkspace.converter.fromUnit,
      activeWorkspace.converter.toUnit,
      activeWorkspace.converter.category,
      appState.customUnits,
      activeWorkspace.converter.regionalLandPreset || 'standard'
    );
  }, [
    activeModule,
    activeWorkspace.converter.inputValue,
    activeWorkspace.converter.fromUnit,
    activeWorkspace.converter.toUnit,
    activeWorkspace.converter.category,
    activeWorkspace.converter.regionalLandPreset,
    appState.customUnits,
  ]);

  // Fallbacks for newly integrated modules if undefined in legacy workspace (Strict Zero-Baseline)
  const defaultContinuousBeam = useMemo(() => createDefaultContinuousBeam(), []);

  const defaultFrameTruss2d = useMemo(() => createDefaultFrameTruss2D(), []);

  const defaultSectionAnalyzer = useMemo(() => createDefaultSectionAnalyzer(), []);

  const defaultRcColumn = useMemo(() => createDefaultRcColumnDesign(), []);

  const defaultStrutAndTie = useMemo(() => createDefaultStrutAndTie(), []);

  const defaultPile = useMemo(() => createDefaultPileCapacity(), []);

  const defaultPipe = useMemo(() => createDefaultPipeHydraulics(), []);

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
      case 'frame-truss-2d':
        return computeFrameTruss2D(activeWorkspace.frameTruss2d || defaultFrameTruss2d);
      case 'section-analyzer':
        return computeSectionMechanics(activeWorkspace.sectionAnalyzer || defaultSectionAnalyzer);
      case 'rc-column-design':
        return computeRcColumnDesign(activeWorkspace.rcColumn || defaultRcColumn);
      case 'strut-and-tie':
        return computeStrutAndTie(activeWorkspace.strutAndTie || defaultStrutAndTie);
      case 'pile-capacity':
        return computePileCapacity(activeWorkspace.pile || defaultPile);
      case 'pipe-hydraulics':
        return computePipeHydraulics(activeWorkspace.pipe || defaultPipe);
      case 'surveying-suite': {
        const surv = activeWorkspace.surveying;
        const area = surv?.computedAreaSqM || 0;
        const vol = surv?.computedExcavationVolumeM3 || 0;
        const rowsCount = surv?.stations?.length || 0;
        return {
          status: 'valid' as const,
          issues: [],
          result: {
            title: 'Surveying Field Leveling & Land Area',
            summary: `Polygon Area: ${area.toFixed(1)} m², Excavation: ${vol.toFixed(1)} m³, ${rowsCount} Leveling Stations`,
            status: 'valid',
            computedAreaSqM: area,
            computedExcavationVolumeM3: vol,
            levelingRowsCount: rowsCount,
          },
        };
      }
      case 'store-inventory': {
        const negativeStock = siteData.inventory.filter((i) => i.currentStock < 0);
        const lowStock = siteData.inventory.filter((i) => i.currentStock <= i.minThreshold && i.currentStock >= 0);
        const totalValuation = siteData.inventory.reduce((sum, i) => sum + Math.max(0, i.currentStock) * i.unitRate, 0);
        const issues: ValidationIssue[] = [];
        if (negativeStock.length > 0) {
          issues.push({
            field: 'inventory',
            message: `Negative stock detected on ${negativeStock.length} materials (${negativeStock.map((i) => i.name).join(', ')})`,
            severity: 'error',
          });
        }
        if (lowStock.length > 0) {
          issues.push({
            field: 'inventory',
            message: `${lowStock.length} items at or below reorder threshold`,
            severity: 'warning',
          });
        }
        return {
          status: negativeStock.length > 0 ? ('invalid' as const) : lowStock.length > 0 ? ('warning' as const) : ('valid' as const),
          issues,
          result: {
            moduleId: activeModule,
            title: 'Store Inventory & Materials Ledger',
            status: negativeStock.length > 0 ? 'invalid' : 'valid',
            totalItems: siteData.inventory.length,
            totalValuation,
            lowStockCount: lowStock.length,
            negativeStockCount: negativeStock.length,
          },
        };
      }
      case 'material-requisition': {
        const criticalPending = siteData.requisitions.filter(
          (r) => r.urgency === 'Critical' && r.status !== 'Received' && r.status !== 'Cancelled'
        );
        const issues: ValidationIssue[] = [];
        if (criticalPending.length > 0) {
          issues.push({
            field: 'requisitions',
            message: `${criticalPending.length} Critical site requisitions pending procurement approval`,
            severity: 'warning',
          });
        }
        return {
          status: criticalPending.length > 0 ? ('warning' as const) : ('valid' as const),
          issues,
          result: {
            moduleId: activeModule,
            title: 'Material Indent & Requisitions',
            status: 'valid',
            totalRequisitions: siteData.requisitions.length,
            criticalCount: criticalPending.length,
          },
        };
      }
      case 'contractor-bills': {
        const overruns = siteData.raBills.filter(
          (b) => b.tenderBoqQuantity && b.totalCumulativeQty && b.totalCumulativeQty > b.tenderBoqQuantity
        );
        const issues: ValidationIssue[] = [];
        if (overruns.length > 0) {
          issues.push({
            field: 'raBills',
            message: `${overruns.length} RA Bills exceed baseline tender BOQ quantity`,
            severity: 'warning',
          });
        }
        return {
          status: overruns.length > 0 ? ('warning' as const) : ('valid' as const),
          issues,
          result: {
            moduleId: activeModule,
            title: 'Sub-Contractor RA Billing Suite',
            status: overruns.length > 0 ? 'warning' : 'valid',
            totalBills: siteData.raBills.length,
            overrunCount: overruns.length,
          },
        };
      }
      case 'petty-cash': {
        const balance = financialSummary.pettyCashBalance;
        const issues: ValidationIssue[] = [];
        if (balance < 0) {
          issues.push({
            field: 'pettyCash',
            message: `Petty Cash deficit! Negative balance: ৳${Math.abs(balance).toLocaleString()}`,
            severity: 'error',
          });
        }
        return {
          status: balance < 0 ? ('invalid' as const) : ('valid' as const),
          issues,
          result: {
            moduleId: activeModule,
            title: 'Site Petty Cash & Imprest',
            status: balance < 0 ? 'invalid' : 'valid',
            balance,
            totalSpent: financialSummary.totalPettyCashSpent,
            transactionCount: siteData.pettyCash.length,
          },
        };
      }
      case 'cube-tests': {
        const failed28d = siteData.cubeTests.filter(
          (c) => c.day28StrengthMPa != null && c.day28StrengthMPa < c.targetStrengthMPa
        );
        const issues: ValidationIssue[] = [];
        if (failed28d.length > 0) {
          issues.push({
            field: 'cubeTests',
            message: `${failed28d.length} Concrete cube/cylinder specimens failed specified 28-day design strength f'c!`,
            severity: 'error',
          });
        }
        return {
          status: failed28d.length > 0 ? ('invalid' as const) : ('valid' as const),
          issues,
          result: {
            moduleId: activeModule,
            title: 'Concrete Cylinder & Cube Compressive Test Register',
            status: failed28d.length > 0 ? 'invalid' : 'valid',
            totalCubes: siteData.cubeTests.length,
            failedCount: failed28d.length,
          },
        };
      }
      case 'schedule-roster':
      case 'labor-attendance':
      case 'field-notebook':
      case 'daily-progress-report':
      case 'office-docs':
        return {
          status: 'valid' as const,
          issues: [],
          result: {
            moduleId: activeModule,
            title: MODULE_META[activeModule]?.label || 'Site Management ERP',
            status: 'valid',
            workersCount: siteData.workers.length,
            milestonesCount: siteData.milestones.length,
            notesCount: siteData.fieldNotes.length,
          },
        };
      case 'testing-lab-qaqc': {
        const lab = activeWorkspace.testingLab || createDefaultTestingLabState();
        const saved = lab.savedRecords || [];
        const failedTests = saved.filter((r) => r.verdict === 'FAIL');
        const warningTests = saved.filter((r) => r.verdict === 'WARNING');
        const issues: ValidationIssue[] = [];
        if (failedTests.length > 0) {
          issues.push({
            field: 'testingLab',
            message: `${failedTests.length} logged lab/field test(s) failed code acceptance limits!`,
            severity: 'error',
          });
        }
        if (warningTests.length > 0) {
          issues.push({
            field: 'testingLab',
            message: `${warningTests.length} logged lab/field test(s) flagged marginal WARNING status.`,
            severity: 'warning',
          });
        }
        return {
          status:
            failedTests.length > 0
              ? ('invalid' as const)
              : warningTests.length > 0
              ? ('warning' as const)
              : ('valid' as const),
          issues,
          result: {
            moduleId: activeModule,
            title: 'Testing Lab & Field QA/QC (নির্মাণ পরীক্ষণ ও মান যাচাই)',
            status: failedTests.length > 0 ? 'invalid' : warningTests.length > 0 ? 'warning' : 'valid',
            totalRecords: saved.length,
            failedCount: failedTests.length,
            activeDomainId: lab.activeDomainId,
            activeTestId: lab.activeTestId,
          },
        };
      }
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
    activeWorkspace.frameTruss2d,
    activeWorkspace.sectionAnalyzer,
    activeWorkspace.rcColumn,
    activeWorkspace.strutAndTie,
    activeWorkspace.pile,
    activeWorkspace.pipe,
    activeWorkspace.surveying,
    activeWorkspace.testingLab,
    siteData,
    financialSummary,
    defaultContinuousBeam,
    defaultFrameTruss2d,
    defaultSectionAnalyzer,
    defaultRcColumn,
    defaultStrutAndTie,
    defaultPile,
    defaultPipe,
  ]);

  const activeRateAnalysisResult = useMemo(() => {
    if (activeModule !== 'boq-estimator') return null;
    return computeRateAnalysis(activeWorkspace.rateAnalysis).result ?? null;
  }, [activeModule, activeWorkspace.rateAnalysis]);

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
      matConcreteVolumeM3?: number;
      masonryNetVolumeM3?: number;
      masonryBricksCount?: number;
      pileConcreteVolumeM3?: number;
      earthworkBankVolumeM3?: number;
      rateAnalysisUnitRate?: number;
      continuousBeamMaxMomentKnm?: number;
      surveyingLandAreaSqM?: number;
      rcColWidthMm?: number;
      rcColDepthMm?: number;
      rcColBarCount?: number;
      rcColBarDiaMm?: number;
      stmRequiredTieSteelMm2?: number;
    } = {
      surveyingLandAreaSqM: activeWorkspace.surveying?.computedAreaSqM || 0,
    };

    if (activeModule === 'rebar-bbs') {
      res.bbsSteelWeightKg = (currentEnvelope.result as any)?.totalSteelWeightKg;
    } else if (activeModule === 'boq-estimator') {
      res.bbsSteelWeightKg = computeRebarBBS(activeWorkspace.rebarBbs).result?.totalSteelWeightKg;
    }

    if (activeModule === 'concrete-materials') {
      res.matConcreteVolumeM3 = (currentEnvelope.result as ConcreteMaterialResult | null)?.wetVolumeM3;
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
    if (activeModule === 'rc-column-design') {
      const cRes = currentEnvelope.result as RcColumnDesignResult | undefined;
      if (cRes) {
        res.rcColWidthMm = cRes.widthB_Mm;
        res.rcColDepthMm = cRes.depthH_Mm;
        res.rcColBarCount = cRes.totalBarCount;
        res.rcColBarDiaMm = cRes.longitudinalBarDiaMm;
      }
    }
    if (activeModule === 'strut-and-tie') {
      const stmRes = currentEnvelope.result as StrutAndTieResult | undefined;
      if (stmRes && stmRes.totalRequiredTieSteelMm2 > 0) {
        res.stmRequiredTieSteelMm2 = stmRes.totalRequiredTieSteelMm2;
      }
    }
    return res;
  }, [isDashboardView, activeModule, currentEnvelope, activeWorkspace.rebarBbs, activeWorkspace.surveying]);

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
        if (moduleId === 'testing-lab-qaqc' && subAction) {
          const domId = subAction as TestingLabDomainId;
          const domainTests = getTestsForDomain(domId);
          const baseLab = ws.testingLab || createDefaultTestingLabState();
          nextWs.testingLab = {
            ...baseLab,
            activeDomainId: domId,
            activeTestId: domainTests[0]?.id || baseLab.activeTestId,
          };
        }
        return nextWs;
      });

      // 2. Set authoritative view states
      setIsDashboardView(false);
      setMobileDrawerOpen(false);
      workbench.recordToolUsage(moduleId);
      civilLab.setActivePage('calculator', moduleId);

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
      setOpenTabs((prev) =>
        prev.map((tab) =>
          tab.id === 'dashboard' && tab.title !== 'Home'
            ? { ...tab, title: 'Home' }
            : tab
        )
      );
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
  // DETERMINISTIC UNIT SYSTEM SWITCHING & QUICK-TOGGLE ENGINE
  // Preserves base SI numerical values while converting UI inputs, outputs & tables
  // --------------------------------------------------------------------------
  const handleSelectUnitPreset = useCallback((preset: UnitSystemPreset) => {
    setIsUnitSystemTransitioning(true);
    setUnitTransitionKey((prev) => prev + 1);

    // 1. Synchronize authoritative global workbench context
    if (preset === 'imperial') {
      workbench.setUnitSystem('Imperial');
    } else if (preset === 'regional') {
      workbench.setUnitSystem('Regional');
    } else {
      workbench.setUnitSystem('SI');
    }

    // 2. Update active workspace unitPreferences without mutating underlying base values
    // Clear per-field unit overrides so the selected global preset drives every input/output unit cleanly
    updateActiveWorkspace((ws) => {
      const currentPreset = ws.unitPreferences?.systemPreset || 'metric';
      if (currentPreset === preset) return ws;

      return {
        ...ws,
        unitPreferences: {
          systemPreset: preset,
          fieldUnits: {},
          outputUnits: {},
        },
      };
    });

    // 3. Confirmation toast banner
    const presetLabel =
      preset === 'metric'
        ? 'SI (METRIC STANDARD)'
        : preset === 'regional'
        ? 'BANGLADESH STANDARD (BNBC / LOCAL SITE)'
        : 'IMPERIAL (US)';
    setToastBanner(`Switched unit system to ${presetLabel} · Values smoothly converted`);

    setTimeout(() => {
      setIsUnitSystemTransitioning(false);
    }, 380);
  }, [updateActiveWorkspace, workbench]);

  const handleQuickToggleUnitSystem = useCallback(() => {
    const current = activeWorkspace.unitPreferences?.systemPreset || 'metric';
    const nextPreset: UnitSystemPreset =
      current === 'imperial' ? 'metric' : current === 'regional' ? 'metric' : 'imperial';
    handleSelectUnitPreset(nextPreset);
  }, [activeWorkspace.unitPreferences?.systemPreset, handleSelectUnitPreset]);

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
    onToggleSunlightMode: () => {
      setSunlightMode((prev) => !prev);
      triggerCelebration(
        !sunlightMode ? 'Field Sunlight Mode Enabled' : 'Standard Contrast Restored',
        !sunlightMode
          ? 'Activated pure black-on-white high-contrast for bright outdoor job sites.'
          : 'Restored standard engineering workbench theme.',
        'info'
      );
    },
    onQuickToggleUnitSystem: handleQuickToggleUnitSystem,
  });

  // Sync Field Sunlight Mode class to html root element
  useEffect(() => {
    document.documentElement.classList.toggle('sunlight-mode', sunlightMode);
  }, [sunlightMode]);

  // Handle outside click for Export & Tools and Worked Examples menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportToolsRef.current && !exportToolsRef.current.contains(e.target as Node)) {
        setExportToolsMenuOpen(false);
      }
      if (workedExamplesRef.current && !workedExamplesRef.current.contains(e.target as Node)) {
        setWorkedExamplesMenuOpen(false);
      }
    };
    if (exportToolsMenuOpen || workedExamplesMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportToolsMenuOpen, workedExamplesMenuOpen]);

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
        record.moduleId === 'frame-truss-2d' ? 'frameTruss2d' :
        record.moduleId === 'section-analyzer' ? 'sectionAnalyzer' :
        record.moduleId === 'rc-column-design' ? 'rcColumn' :
        record.moduleId === 'strut-and-tie' ? 'strutAndTie' :
        record.moduleId === 'pile-capacity' ? 'pile' :
        record.moduleId === 'pipe-hydraulics' ? 'pipe' :
        record.moduleId === 'surveying-suite' ? 'surveying' :
        record.moduleId === 'testing-lab-qaqc' ? 'testingLab' :
        record.moduleId === 'unit-converter' ? 'converter' : 'boq';
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
    // BNBC/PWD Standard: minimum footing thickness 300mm (0.3m) or approx B * 250mm
    const footingThicknessMm = Math.max(300, Math.round((b * 250) / 50) * 50);
    // PWD standard working space excavation offset: 300mm (0.3m) on each side -> pit = B + 0.6m
    const pitDimensionM = Math.round((b + 0.6) * 100) / 100;
    // Bedding allowance: 150mm (0.15m) PCC/BFS beneath footing -> pit depth = Df + 0.15m
    const pitDepthM = Math.round((df + 0.15) * 100) / 100;

    updateActiveWorkspace((ws) => ({
      ...ws,
      rebarBbs: {
        ...ws.rebarBbs,
        elementType: 'footing',
        elementCount: Math.max(1, ws.rebarBbs.elementCount || 1),
        rebarDensityKgPerM3: ws.rebarBbs.rebarDensityKgPerM3 || 7850,
        clearCoverMm: ws.rebarBbs.clearCoverMm || 75,
        footingWidthM: b,
        footingLengthM: b,
        footingThicknessMm,
        footingBarDiaMm: ws.rebarBbs.footingBarDiaMm || 16,
        footingBarSpacingMm: ws.rebarBbs.footingBarSpacingMm || 150,
      },
      earthwork: {
        ...ws.earthwork,
        calculationType: 'pit-excavation',
        pitTopWidthM: pitDimensionM,
        pitTopLengthM: pitDimensionM,
        pitDepthM,
      },
    }));
    triggerCelebration(
      'Foundation Geometry & Excavation Linked',
      `Footing (${b}m × ${b}m × ${footingThicknessMm}mm) synced to BBS. Pit excavation set to ${pitDimensionM}m × ${pitDimensionM}m × ${pitDepthM}m (including 300mm PWD working space & 150mm PCC/BFS bedding).`,
      'success'
    );
  };

  const handleTransferBearingToPile = () => {
    const P = activeWorkspace.bearing.appliedColumnLoadKn;
    const phi = activeWorkspace.bearing.frictionAngleDeg;
    const c = activeWorkspace.bearing.soilCohesionKpa;
    const gamma = activeWorkspace.bearing.unitWeightKnPerM3;
    const dw = activeWorkspace.bearing.waterTableDepthM ?? 2.0;
    const sptN = Math.max(4, Math.round(phi > 0 ? phi / 1.5 : 8));

    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'pile-capacity',
      pile: {
        ...(ws.pile || defaultPile),
        appliedLoadKn: P,
        waterTableDepthM: dw,
        tipBearingCohesionKpa: c,
        tipBearingFrictionDeg: phi,
        tipBearingUnitWeightKnPerM3: gamma,
        layers: (ws.pile?.layers || defaultPile.layers).map((layer, idx) => {
          if (idx === 0) {
            return {
              ...layer,
              cohesionKpa: c,
              frictionAngleDeg: phi,
              unitWeightKnPerM3: gamma,
              sptN,
            };
          }
          return layer;
        }),
      },
    }));
    navigateToModule('pile-capacity');
    triggerCelebration(
      'Geotech Parameters Passed to Deep Pile',
      `Transferred Column Axial Load P=${P} kN, GWT depth=${dw}m, and soil parameters (c=${c} kPa, φ=${phi}°, N=${sptN}) to Pile Foundation module.`,
      'celebrate'
    );
  };

  const handleTransferBeamToRebar = () => {
    const span = activeWorkspace.beam.spanLengthM;
    const depthMm = activeWorkspace.beam.sectionDepthMm || 500;
    const widthMm = 250;
    const beamRes = (activeModule === 'beam-analysis' ? currentEnvelope.result : computeBeamAnalysis(activeWorkspace.beam).result) as BeamAnalysisResult;
    const maxMomentKnm = beamRes?.maxMomentKnm || 0;
    const maxShearKn = beamRes?.maxShearKn || 0;

    // Use BNBC-2020 / ACI 318-19 flexure and shear engineering engine
    const design = computeBeamFlexureAndShearDesign({
      spanLengthM: span,
      depthMm,
      widthMm,
      governingMomentKnm: maxMomentKnm,
      governingShearKn: maxShearKn,
      concreteGradeFckMpa: activeWorkspace.concrete?.targetStrengthMpa || 25,
      steelGradeFyMpa: 420,
      isContinuous: false,
    });

    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'rebar-bbs',
      rebarBbs: {
        ...ws.rebarBbs,
        elementType: 'beam',
        elementCount: Math.max(1, ws.rebarBbs.elementCount || 1),
        rebarDensityKgPerM3: ws.rebarBbs.rebarDensityKgPerM3 || 7850,
        clearCoverMm: ws.rebarBbs.clearCoverMm || 25,
        beamLengthM: span,
        beamDepthMm: depthMm,
        beamWidthMm: widthMm,
        beamMainBarDiaMm: design.bottomBars.diaMm,
        beamTopBarCount: design.topBars.count,
        beamBotBarCount: design.bottomBars.count,
        beamStirrupDiaMm: design.stirrups.diaMm,
        beamStirrupSpacingMm: design.stirrups.spacingMm,
      },
    }));
    navigateToModule('rebar-bbs');
    triggerCelebration(
      'Beam Flexural & Shear Rebar Designed',
      `BNBC-2020 Design (M=${maxMomentKnm.toFixed(1)} kN·m, V=${maxShearKn.toFixed(1)} kN): Bottom ${design.bottomBars.count}-Ø${design.bottomBars.diaMm}mm (As=${Math.round(design.bottomBars.asProvidedMm2)}mm²), Top ${design.topBars.count}-Ø${design.topBars.diaMm}mm, Stirrups Ø${design.stirrups.diaMm}@${design.stirrups.spacingMm}mm c/c.`,
      'celebrate'
    );
  };

  const handleTransferContinuousBeamToRebar = () => {
    const contEnv = (activeModule === 'continuous-beam' ? currentEnvelope : computeContinuousBeam(activeWorkspace.continuousBeam || defaultContinuousBeam)) as CalculationEnvelope<ContinuousBeamResult>;
    if (!contEnv.result) return;
    const maxSagM = contEnv.result.maxSaggingMomentKnm;
    const maxHogM = contEnv.result.maxHoggingMomentKnm;
    const maxV = contEnv.result.maxShearKn;
    const firstSpan = (activeWorkspace.continuousBeam || defaultContinuousBeam).spans[0];
    const spanL = firstSpan ? firstSpan.lengthM : 6.0;
    const depthMm = (activeWorkspace.continuousBeam || defaultContinuousBeam).sectionDepthMm || 600;
    const widthMm = (activeWorkspace.continuousBeam || defaultContinuousBeam).sectionWidthMm || 300;

    const design = computeBeamFlexureAndShearDesign({
      spanLengthM: spanL,
      depthMm,
      widthMm,
      governingMomentKnm: maxSagM,
      hoggingMomentKnm: maxHogM,
      governingShearKn: maxV,
      concreteGradeFckMpa: activeWorkspace.concrete?.targetStrengthMpa || 25,
      steelGradeFyMpa: 420,
      isContinuous: true,
    });

    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'rebar-bbs',
      rebarBbs: {
        ...ws.rebarBbs,
        elementType: 'beam',
        elementCount: Math.max(1, ws.rebarBbs.elementCount || 1),
        rebarDensityKgPerM3: ws.rebarBbs.rebarDensityKgPerM3 || 7850,
        clearCoverMm: ws.rebarBbs.clearCoverMm || 25,
        beamLengthM: spanL,
        beamDepthMm: depthMm,
        beamWidthMm: widthMm,
        beamMainBarDiaMm: design.bottomBars.diaMm,
        beamTopBarCount: design.topBars.count,
        beamBotBarCount: design.bottomBars.count,
        beamStirrupDiaMm: design.stirrups.diaMm,
        beamStirrupSpacingMm: design.stirrups.spacingMm,
      },
    }));
    navigateToModule('rebar-bbs');
    triggerCelebration(
      'Continuous Beam Steel Designed',
      `Continuous Beam Design (+M=${maxSagM.toFixed(1)}, -M=${maxHogM.toFixed(1)} kN·m): Bottom ${design.bottomBars.count}-Ø${design.bottomBars.diaMm}mm, Top ${design.topBars.count}-Ø${design.topBars.diaMm}mm, Stirrups Ø${design.stirrups.diaMm}@${design.stirrups.spacingMm}mm c/c.`,
      'celebrate'
    );
  };

  const handleTransferRcColumnToRebar = () => {
    const col = activeWorkspace.rcColumn || defaultRcColumn;
    const colEnv = (activeModule === 'rc-column-design' ? currentEnvelope : computeRcColumnDesign(col)) as CalculationEnvelope<RcColumnDesignResult>;
    const totalBars = colEnv.result?.totalBarCount ?? Math.max(4, 2 * Math.max(2, col.barsAlongWidthB) + 2 * Math.max(0, col.barsAlongDepthH - 2));

    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'rebar-bbs',
      rebarBbs: {
        ...ws.rebarBbs,
        elementType: 'column',
        elementCount: Math.max(1, ws.rebarBbs.elementCount || 1),
        rebarDensityKgPerM3: ws.rebarBbs.rebarDensityKgPerM3 || 7850,
        clearCoverMm: col.clearCoverMm || 40,
        colLengthMm: col.depthH_Mm || 400,
        colWidthMm: col.widthB_Mm || 400,
        colHeightM: col.unsupportedLengthLu_M || 3.2,
        colMainBarDiaMm: col.longitudinalBarDiaMm || 20,
        colMainBarCount: totalBars,
        tieBarDiaMm: col.tieBarDiaMm || 10,
        tieSpacingMm: col.tieSpacingMm || 200,
      },
    }));
    navigateToModule('rebar-bbs');
    triggerCelebration(
      'RC Column Rebar Synced to BBS',
      `Synced ${col.widthB_Mm}×${col.depthH_Mm}mm column (${col.unsupportedLengthLu_M}m height) with ${totalBars}-Ø${col.longitudinalBarDiaMm}mm main bars & Ø${col.tieBarDiaMm}@${col.tieSpacingMm}mm ties to Column Rebar BBS.`,
      'celebrate'
    );
  };

  const handleTransferStmToRebarBbs = () => {
    const stm = activeWorkspace.strutAndTie || defaultStrutAndTie;
    const stmEnv = (activeModule === 'strut-and-tie' ? currentEnvelope : computeStrutAndTie(stm)) as CalculationEnvelope<StrutAndTieResult>;
    const reqAs = stmEnv.result?.totalRequiredTieSteelMm2 || 1500;
    const barDiaMm = reqAs >= 2500 ? 25 : 20;
    const singleBarArea = (Math.PI * barDiaMm * barDiaMm) / 4;
    const botBarCount = Math.max(4, Math.ceil(reqAs / singleBarArea));
    const topBarCount = Math.max(2, Math.ceil(botBarCount * 0.4));
    const xs = stm.nodes.map((n) => n.xM);
    const ys = stm.nodes.map((n) => n.yM);
    const spanFromNodesM = xs.length >= 2 ? Math.max(...xs) - Math.min(...xs) : 0;
    const depthFromNodesM = ys.length >= 2 ? Math.max(...ys) - Math.min(...ys) : 0;
    const spanLengthM = Number((spanFromNodesM > 0 ? spanFromNodesM : 3.2).toFixed(2));
    const depthMm = Math.round((depthFromNodesM > 0 ? depthFromNodesM : 1.2) * 1000);
    const widthMm = stm.memberThicknessMm || 400;

    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'rebar-bbs',
      rebarBbs: {
        ...ws.rebarBbs,
        elementType: 'beam',
        elementCount: Math.max(1, ws.rebarBbs.elementCount || 1),
        rebarDensityKgPerM3: ws.rebarBbs.rebarDensityKgPerM3 || 7850,
        clearCoverMm: 40,
        beamLengthM: spanLengthM,
        beamDepthMm: depthMm,
        beamWidthMm: widthMm,
        beamMainBarDiaMm: barDiaMm,
        beamBotBarCount: botBarCount,
        beamTopBarCount: topBarCount,
        beamStirrupDiaMm: 12,
        beamStirrupSpacingMm: 150,
      },
    }));
    navigateToModule('rebar-bbs');
    triggerCelebration(
      'STM Deep Beam Tie Steel Synced to BBS',
      `Synced ${widthMm}×${depthMm}mm deep beam (${spanLengthM}m span) with ${botBarCount}-Ø${barDiaMm}mm bottom tie bars (As,prov = ${Math.round(botBarCount * singleBarArea)} mm² ≥ As,req = ${Math.round(reqAs)} mm²) to Rebar BBS.`,
      'celebrate'
    );
  };

  const handleTransferPipeToBoq = () => {
    const pipeData = activeWorkspace.pipe || defaultPipe;
    const lengthM = pipeData.lengthM ?? 0;
    const diaMm = pipeData.internalDiameterMm ?? 0;
    const matName = pipeData.pipeMaterial === 'pvc-hdpe' ? 'uPVC Pressure Pipe' : 'Ductile Iron Pipe';
    const dynamicRate = resolveDynamicRate(activeWorkspace, 'pipe', { pipeDiaMm: diaMm });

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
          description: `6.01 - Supply and Laying of ${diaMm}mm Ø ${matName} [PWD Schedule]`,
          unitRate: dynamicRate,
        };
      } else {
        updatedItems.push({
          id: `takeoff-${generateUUID().slice(0, 8)}`,
          itemNo: '6.01',
          description: `Supply and Laying of ${diaMm}mm Ø ${matName} with rubber ring joints [PWD Schedule]`,
          category: 'plumbing',
          numberOfMembers: 1,
          lengthM,
          widthM: 1,
          heightM: 1,
          deductionQty: 0,
          unit: 'm',
          wastagePercent: 3.0,
          unitRate: dynamicRate,
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
      `Transferred ${lengthM}m of ${diaMm}mm Ø pipe into BOQ at dynamic rate ৳${dynamicRate}/m.`,
      'celebrate'
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
    const members = Array.isArray(activeWorkspace.concreteMaterials.members)
      ? activeWorkspace.concreteMaterials.members.filter((m) => (m.count || 0) > 0 && (m.computedVolumeM3 || 0) > 0)
      : [];
    const dynamicRate = resolveDynamicRate(activeWorkspace, 'concrete');

    const newBoqItems: TakeoffLineItem[] =
      members.length > 0
        ? members.map((m, idx) => {
            let lengthM = m.lengthM || 1;
            let widthM = m.widthM || 1;
            let heightM = m.heightM || 1;
            if (m.shape === 'circular-column') {
              const dia = m.diameterM || m.lengthM || 0.3;
              lengthM = Number(dia.toFixed(3));
              widthM = Number(((dia * Math.PI) / 4).toFixed(3));
              heightM = Number((m.heightM || 3).toFixed(3));
            } else if (m.shape === 'trapezoidal-footing') {
              const planArea = Math.max(0.01, lengthM * widthM);
              heightM = Number((m.computedVolumeM3 / planArea).toFixed(3));
            }
            return {
              id: `takeoff-${generateUUID().slice(0, 8)}`,
              itemNo: `${activeWorkspace.boq.items.length + idx + 1}.01`,
              description: `${m.name} — Cast in situ RCC (${m.shape}) [Concrete Materials]`,
              category: 'superstructure' as const,
              numberOfMembers: m.count,
              lengthM: Number(lengthM.toFixed(3)),
              widthM: Number(widthM.toFixed(3)),
              heightM: Number(heightM.toFixed(3)),
              deductionQty: 0,
              unit: 'm3' as const,
              wastagePercent: activeWorkspace.concreteMaterials.wastagePercent ?? 3.0,
              unitRate: dynamicRate,
            };
          })
        : [
            {
              id: `takeoff-${generateUUID().slice(0, 8)}`,
              itemNo: `${activeWorkspace.boq.items.length + 1}.01`,
              description: `Cast in situ Reinforced Cement Concrete (RCC) volume batch (${(activeWorkspace.concreteMaterials.wetVolumeM3 || 1.0).toFixed(2)} m³) [PWD Schedule]`,
              category: 'superstructure' as const,
              numberOfMembers: 1,
              lengthM: Number((activeWorkspace.concreteMaterials.wetVolumeM3 || 1.0).toFixed(3)),
              widthM: 1,
              heightM: 1,
              deductionQty: 0,
              unit: 'm3' as const,
              wastagePercent: activeWorkspace.concreteMaterials.wastagePercent ?? 3.0,
              unitRate: dynamicRate,
            },
          ];

    const totalTransferredVol =
      members.length > 0
        ? members.reduce((sum, m) => sum + (m.computedVolumeM3 || 0) * (m.count || 0), 0)
        : activeWorkspace.concreteMaterials.wetVolumeM3 || 1.0;

    updateActiveWorkspace((ws) => ({
      ...ws,
      activeModule: 'boq-estimator',
      boq: {
        ...ws.boq,
        items: [...ws.boq.items, ...newBoqItems],
      },
    }));
    navigateToModule('boq-estimator');
    triggerCelebration(
      'Materials Synced to BOQ',
      `Transferred ${newBoqItems.length} item(s) totaling ${totalTransferredVol.toFixed(2)} m³ concrete to BOQ at ৳${dynamicRate.toLocaleString()}/m³.`,
      'celebrate'
    );
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
    const earthworkRes = computeEarthwork(activeWorkspace.earthwork).result;
    const bankVol = earthworkRes?.bankVolumeM3 || 0;
    const ew = activeWorkspace.earthwork;
    const dynamicRate = resolveDynamicRate(activeWorkspace, 'earthwork');

    // Preserve actual physical bounding dimensions from earthwork type
    let numMembers = 1;
    let lenM = 1;
    let widM = 1;
    let hgtM = 1;

    if (ew.calculationType === 'pit-excavation') {
      lenM = ew.pitTopLengthM || 2.0;
      widM = ew.pitTopWidthM || 2.0;
      hgtM = ew.pitDepthM || 1.5;
    } else if (ew.calculationType === 'trapezoidal-trench') {
      lenM = ew.trenchLengthM || 50;
      widM = ew.trenchBottomWidthM || 1.0;
      hgtM = ew.trenchDepthM || 1.5;
    } else {
      lenM = ew.roadLengthM || 100;
      widM = ew.formationWidthM || 7.3;
      hgtM = Math.max(0.5, ew.depthStation1M || 1.0);
    }

    updateActiveWorkspace((ws) => {
      const existingIdx = ws.boq.items.findIndex(
        (it) => it.itemNo === '1.01' || it.description.toLowerCase().includes('earthwork') || it.description.toLowerCase().includes('excavation')
      );
      let updatedItems = [...ws.boq.items];
      if (existingIdx >= 0) {
        updatedItems[existingIdx] = {
          ...updatedItems[existingIdx],
          numberOfMembers: numMembers,
          lengthM: lenM,
          widthM: widM,
          heightM: hgtM,
          unit: 'm3',
          description: `1.01 - Site earthwork excavation and compaction (${bankVol.toLocaleString()} m³) [PWD Schedule]`,
          unitRate: dynamicRate,
        };
      } else {
        updatedItems.push({
          id: `takeoff-${generateUUID().slice(0, 8)}`,
          itemNo: '1.01',
          description: `Earthwork excavation in foundation trenches and site leveling [PWD Schedule]`,
          category: 'earthwork',
          numberOfMembers: numMembers,
          lengthM: lenM,
          widthM: widM,
          heightM: hgtM,
          deductionQty: 0,
          unit: 'm3',
          wastagePercent: 5.0,
          unitRate: dynamicRate,
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
      `Transferred ${bankVol.toLocaleString()} m³ excavation to BOQ at dynamic rate ৳${dynamicRate}/m³.`,
      'celebrate'
    );
  };

  const handleTransferSurveyingToBoq = (
    landAreaSqMParam?: number,
    excavationVolParam?: number,
    formationRLParam?: number
  ) => {
    const area = landAreaSqMParam ?? activeWorkspace.surveying?.computedAreaSqM ?? 0;
    const vol = excavationVolParam ?? activeWorkspace.surveying?.computedExcavationVolumeM3 ?? 0;
    const fRL = formationRLParam ?? activeWorkspace.surveying?.formationRL;

    // Update earthwork module with true cut/fill volume and dimensions
    const sideM = Math.round(Math.sqrt(Math.max(area, 1)) * 10) / 10;
    const avgDepthM = area > 0 && vol > 0 ? Math.round((vol / area) * 100) / 100 : 1.5;

    const syncRes = syncSurveyingEarthworkToBoq(activeWorkspace, {
      landAreaSqM: area,
      excavationVolumeM3: vol,
      formationRL: fRL,
    });

    updateActiveWorkspace((ws) => ({
      ...syncRes.updatedWorkspace,
      activeModule: 'boq-estimator',
      earthwork: {
        ...ws.earthwork,
        calculationType: 'pit-excavation',
        pitTopLengthM: sideM,
        pitTopWidthM: sideM,
        pitDepthM: avgDepthM,
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
        ...(ws.surveying || {}),
        computedAreaSqM: area,
        computedExcavationVolumeM3: vol,
        ...(fRL !== undefined ? { formationRL: fRL } : {}),
      },
    }));

    navigateToModule('boq-estimator');
    triggerCelebration(
      'Surveying -> Earthwork & BOQ Synced',
      `Transferred Area: ${area.toFixed(1)} m², Excavation: ${vol.toFixed(1)} m³ with PWD earthwork rates to BOQ & Earthwork.`,
      'celebrate'
    );
  };

  const handleSyncBoqToInventory = () => {
    const ceilings = extractDesignMaterialCeilings(activeWorkspace);
    const syncRes = syncDesignCeilingsToInventory(
      siteData,
      ceilings,
      updateInventoryItem,
      addInventoryItem
    );
    triggerCelebration(
      'Design Material Ceilings Synced to Store Inventory',
      `Updated ${syncRes.updatedCount} items (Cement: ${ceilings.cementBags.toLocaleString()} bags, Sand: ${ceilings.sandCft.toLocaleString()} cft, Coarse Agg: ${ceilings.coarseAggregateCft.toLocaleString()} cft, Rebar: ${ceilings.rebarTonnes.toFixed(2)} T, Bricks: ${ceilings.bricksNos.toLocaleString()} pcs).`,
      'celebrate'
    );
  };

  const handlePushResourceCeilingsToInventory = (resourceAbstract: BOQResourceAbstract) => {
    const ceilings = {
      cementBags: Math.round(resourceAbstract.cementBags50Kg * 10) / 10,
      sandCft: Math.round(resourceAbstract.sandCft),
      coarseAggregateCft: Math.round(resourceAbstract.coarseAggregateCft),
      bricksNos: Math.round(resourceAbstract.bricksNos),
      rebarTonnes: Math.round(resourceAbstract.rebarTonnes * 100) / 100,
      rebarByDiaTonnes: {},
      totalConcreteM3: Math.round(resourceAbstract.concreteVolumeM3 * 100) / 100,
      earthworkBankM3: Math.round(resourceAbstract.earthworkVolumeM3 * 100) / 100,
    };
    const syncRes = syncDesignCeilingsToInventory(
      siteData,
      ceilings,
      updateInventoryItem,
      addInventoryItem
    );
    triggerCelebration(
      'BOQ Resource Ceilings Pushed to Store Inventory (SM-01)',
      `Updated ${syncRes.updatedCount} store items (Cement: ${ceilings.cementBags.toLocaleString()} bags, Sand: ${ceilings.sandCft.toLocaleString()} CFT, Agg: ${ceilings.coarseAggregateCft.toLocaleString()} CFT, Rebar: ${ceilings.rebarTonnes.toFixed(2)} MT, Bricks: ${ceilings.bricksNos.toLocaleString()} Nos).`,
      'celebrate'
    );
  };

  const handleSyncMixToCubeTests = () => {
    const concrete = activeWorkspace.concrete;
    const targetFc = concrete.targetStrengthMpa || 25;
    const grade: ConcreteGrade = targetFc >= 35 ? 'M35' : targetFc >= 30 ? 'M30' : targetFc >= 25 ? 'M25' : targetFc >= 20 ? 'M20' : 'M15';
    const mixRatio = targetFc >= 30 ? '1:1.5:3' : targetFc >= 25 ? '1:2:4' : '1:2.5:5';
    const pourVol = concrete.batchVolumeM3 || 10;
    const todayStr = new Date().toISOString().split('T')[0];

    const newRecord = addCubeTestRecord({
      pourId: `POUR-${Date.now().toString().slice(-4)}`,
      castingDate: todayStr,
      structuralElement: `${activeWorkspace.projectCode} - Beams & Columns Frame Pour`,
      concreteGrade: grade,
      targetStrengthMPa: targetFc,
      slumpMm: 100,
      mixRatio,
      pourVolumeM3: pourVol,
      status: 'Scheduled',
      remarks: `Target f'c=${targetFc} MPa synced directly from ACI/BNBC Concrete Mix Design.`,
    });

    navigateToModule('cube-tests');
    triggerCelebration(
      'Concrete Mix Synced to Cube Test Register',
      `Created specimen set #${newRecord.pourId} for ${pourVol} m³ pour (${grade}, f'c=${targetFc} MPa, ratio ${mixRatio}).`,
      'celebrate'
    );
  };

  const handleGenerateRequisitionFromModule = (
    sourceModule: 'concrete-materials' | 'rebar-bbs' | 'masonry-finishes'
  ) => {
    const mRates = activeWorkspace.marketRates || createDefaultMasterMarketRates();
    const todayStr = new Date().toISOString().split('T')[0];
    const reqDateObj = new Date();
    reqDateObj.setDate(reqDateObj.getDate() + 3);
    const requiredByDate = reqDateObj.toISOString().split('T')[0];

    const matchStoreOrCreate = (
      keywords: string[],
      fallbackName: string,
      unit: MaterialUnit,
      qty: number,
      fallbackRate: number,
      notes?: string
    ): RequisitionItem => {
      const invMatch = siteData.inventory.find((inv) =>
        keywords.some((kw) => inv.name.toLowerCase().includes(kw.toLowerCase()))
      );
      return {
        itemId: invMatch ? invMatch.id : `req-${fallbackName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        itemName: invMatch ? invMatch.name : fallbackName,
        unit: invMatch ? invMatch.unit : unit,
        requestedQty: qty,
        estimatedRate: invMatch && invMatch.unitRate > 0 ? invMatch.unitRate : fallbackRate,
        currentStockAtReq: invMatch ? invMatch.currentStock : 0,
        notes,
      };
    };

    const items: RequisitionItem[] = [];
    let sourceLabel = '';

    if (sourceModule === 'concrete-materials') {
      const matRes = computeConcreteMaterials(activeWorkspace.concreteMaterials).result;
      if (!matRes || matRes.wetVolumeM3 <= 0) {
        triggerCelebration('No Material Quantities', 'Enter valid concrete dimensions before generating a requisition.', 'info');
        return;
      }
      sourceLabel = `Concrete Materials (${matRes.wetVolumeM3.toFixed(2)} m³ wet pour)`;
      if (matRes.cementBags50Kg > 0) {
        items.push(
          matchStoreOrCreate(
            ['cement'],
            'OPC / PCC Cement (50 kg Bag)',
            'Bags',
            Math.ceil(matRes.cementBags50Kg),
            mRates.cementBag50Kg,
            `Computed ${matRes.cementBags50Kg.toFixed(1)} bags`
          )
        );
      }
      if (matRes.sandCft > 0) {
        items.push(
          matchStoreOrCreate(
            ['sylhet sand', 'coarse sand', 'sand'],
            'Sylhet Coarse Sand (FM 2.5+)',
            'CFT',
            Math.ceil(matRes.sandCft),
            mRates.sylhetSandPerCft,
            `Computed ${matRes.sandCft.toFixed(1)} CFT`
          )
        );
      }
      if (matRes.aggregateCft > 0) {
        const isKhoa = matRes.coarseAggregateType === 'brick-shingles';
        items.push(
          matchStoreOrCreate(
            isKhoa ? ['khoa', 'brick aggregate'] : ['stone', 'chips', 'aggregate'],
            isKhoa ? 'Picked Jhama Brick Khoa (20mm)' : '20mm Crushed Stone Chips',
            'CFT',
            Math.ceil(matRes.aggregateCft),
            isKhoa ? mRates.brickKhoaPerCft : mRates.stoneChips20mmPerCft,
            `Computed ${matRes.aggregateCft.toFixed(1)} CFT`
          )
        );
      }
    } else if (sourceModule === 'rebar-bbs') {
      const bbsRes = computeRebarBBS(activeWorkspace.rebarBbs).result;
      if (!bbsRes || bbsRes.totalSteelWeightKg <= 0) {
        triggerCelebration('No Rebar Quantities', 'Enter valid reinforcement details before generating a requisition.', 'info');
        return;
      }
      sourceLabel = `Rebar BBS (${bbsRes.totalSteelTonnes.toFixed(3)} MT total steel)`;
      const weightByDiaKg = new Map<number, number>();
      for (const bar of bbsRes.items) {
        if (bar.totalWeightKg > 0) {
          weightByDiaKg.set(bar.barDiaMm, (weightByDiaKg.get(bar.barDiaMm) || 0) + bar.totalWeightKg);
        }
      }
      Array.from(weightByDiaKg.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([diaMm, kg]) => {
          const tonnes = Math.max(0.01, Math.round((kg / 1000) * 1000) / 1000);
          items.push(
            matchStoreOrCreate(
              [`${diaMm}mm`, `Ø${diaMm}`, `rebar ${diaMm}`, 'deformed'],
              `Grade 500W Deformed Rebar Ø${diaMm}mm`,
              'Ton',
              tonnes,
              mRates.rebar500WPerTon,
              `${Math.round(kg).toLocaleString()} kg net cutting weight`
            )
          );
        });
    } else if (sourceModule === 'masonry-finishes') {
      const masRes = computeMasonryFinishes(activeWorkspace.masonry).result;
      if (!masRes || (masRes.bricksWithWastageCount <= 0 && masRes.netWallVolumeM3 <= 0)) {
        triggerCelebration('No Masonry Quantities', 'Enter valid wall or finish dimensions before generating a requisition.', 'info');
        return;
      }
      sourceLabel = `Masonry & Finishes (${masRes.netWallAreaM2.toFixed(1)} m² net wall)`;
      const totalBricks = Math.ceil(
        (masRes.bricksWithWastageCount || 0) +
          (masRes.bfsHbbSchedule?.bricksWithWastageCount || 0) +
          (masRes.jhamaKhoaSchedule?.bricksWithWastageCount || 0)
      );
      if (totalBricks > 0) {
        items.push(
          matchStoreOrCreate(
            ['brick'],
            'First-Class Clay Bricks (BD Standard)',
            'Nos',
            totalBricks,
            Number((mRates.firstClassBrickPer1000 / 1000).toFixed(2)),
            `Includes wastage & BFS/Khoa if active`
          )
        );
      }
      const totalBags = Math.ceil((masRes.mortarCementBags50Kg || 0) + (masRes.plasterCementBags || 0));
      if (totalBags > 0) {
        items.push(
          matchStoreOrCreate(
            ['cement'],
            'Cement (50 kg Bag · Mortar + Plaster)',
            'Bags',
            totalBags,
            mRates.cementBag50Kg,
            `Mortar ${(masRes.mortarCementBags50Kg || 0).toFixed(1)} + Plaster ${(masRes.plasterCementBags || 0).toFixed(1)} bags`
          )
        );
      }
      const totalSandCft = Math.ceil(
        (masRes.mortarSandCft || 0) +
          (masRes.plasterSandCft || 0) +
          (masRes.bfsHbbSchedule?.sandCushionCft || 0)
      );
      if (totalSandCft > 0) {
        items.push(
          matchStoreOrCreate(
            ['local sand', 'fine sand', 'sand'],
            'Local Screened Sand (Mortar + Plaster)',
            'CFT',
            totalSandCft,
            mRates.localSandPerCft,
            `Mortar + Plaster + Sub-base cushion`
          )
        );
      }
      if (masRes.paintPuttySchedule && masRes.paintPuttySchedule.paintLitersRequired > 0) {
        items.push(
          matchStoreOrCreate(
            ['paint', 'emulsion'],
            'Acrylic Emulsion / Weather Coat Paint',
            'Liters',
            Math.ceil(masRes.paintPuttySchedule.paintLitersRequired),
            550,
            `${masRes.paintPuttySchedule.paintGallons} Gal (${activeWorkspace.masonry.paintCoats || 2} coats)`
          )
        );
      }
    }

    if (items.length === 0) return;

    const seqNum = String(siteData.requisitions.length + 1).padStart(3, '0');
    const createdReq = createRequisition({
      reqNo: `IND-${activeWorkspace.projectCode || 'BDCL'}-${seqNum}`,
      date: todayStr,
      requiredByDate,
      urgency: 'Urgent',
      items,
      status: 'Pending',
      requestedBy: userProfile.fullName || activeWorkspace.engineerOfRecord || 'Not Set',
      notes: `Auto-generated procurement indent from ${sourceLabel}.`,
    });

    navigateToModule('material-requisition');
    triggerCelebration(
      `Requisition Slip ${createdReq.reqNo} Created (SM-02)`,
      `Packaged ${items.length} procurement line items from ${sourceLabel} into pending Site Requisitions.`,
      'celebrate'
    );
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

  const handleSwitchUnitPreset = handleSelectUnitPreset;

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
          record.moduleId === 'frame-truss-2d' ? 'frameTruss2d' :
          record.moduleId === 'section-analyzer' ? 'sectionAnalyzer' :
          record.moduleId === 'rc-column-design' ? 'rcColumn' :
          record.moduleId === 'strut-and-tie' ? 'strutAndTie' :
          record.moduleId === 'pile-capacity' ? 'pile' :
          record.moduleId === 'pipe-hydraulics' ? 'pipe' :
          record.moduleId === 'surveying-suite' ? 'surveying' :
          record.moduleId === 'testing-lab-qaqc' ? 'testingLab' :
          record.moduleId === 'unit-converter' ? 'converter' : 'boq';
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

  // Keep CivilLabContext userProfile.theme synchronized with activeEngineeringTheme
  useEffect(() => {
    if (civilLab.userProfile.theme !== activeEngineeringTheme) {
      civilLab.updateUserProfile({ theme: activeEngineeringTheme });
    }
  }, [activeEngineeringTheme]);

  const handleThemeChange = (pref: ThemePreference) => {
    setAppState((prev) => ({ ...prev, themePreference: pref }));
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
    if (!updatedProfile || typeof updatedProfile !== 'object') return;

    const sanitizeField = (val: unknown): string => {
      if (typeof val !== 'string') return '';
      const cleaned = val.trim().replace(/\s+/g, ' ');
      return cleaned === 'undefined' || cleaned === 'null' ? '' : cleaned;
    };

    const cleanName = sanitizeField(updatedProfile.fullName);
    const cleanTitle = sanitizeField(updatedProfile.designation);
    const cleanOrg = sanitizeField(updatedProfile.organization);
    const cleanLic = sanitizeField(updatedProfile.licenseNumber);
    const cleanEmail = typeof updatedProfile.email === 'string' ? updatedProfile.email.trim() : '';
    const cleanPhone = sanitizeField(updatedProfile.phone);
    const cleanAddr = sanitizeField(updatedProfile.address);

    const computedInitials = cleanName
      ? cleanName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() || '')
          .join('')
      : '';

    const normalizedProfile: UserProfile = {
      ...updatedProfile,
      fullName: cleanName,
      designation: cleanTitle,
      organization: cleanOrg,
      licenseNumber: cleanLic,
      email: cleanEmail,
      phone: cleanPhone,
      address: cleanAddr,
      initials: cleanName
        ? sanitizeField(updatedProfile.initials).toUpperCase() || computedInitials
        : '',
    };

    const saveTimestamp = new Date().toISOString();

    setAppState((prev) => {
      const prevProfileName =
        typeof prev.userProfile?.fullName === 'string' ? prev.userProfile.fullName.trim() : '';
      const isNameCleared = cleanName.length === 0;
      const currentWorkspaces = Array.isArray(prev.workspaces) ? prev.workspaces : [];

      return {
        ...prev,
        userProfile: normalizedProfile,
        workspaces: currentWorkspaces.map((ws) => {
          const rawEor = typeof ws.engineerOfRecord === 'string' ? ws.engineerOfRecord : '';
          const currentEor = rawEor.trim();
          const isActiveWs = ws.id === prev.activeWorkspaceId;
          const matchesPrevProfile = prevProfileName.length > 0 && currentEor === prevProfileName;
          const isOrphanedPreseeded =
            isNameCleared && /prokash\s*biswas|lead structural engineer/i.test(currentEor);
          const isBlankOrWhitespace = currentEor.length === 0;

          if (!isActiveWs && !matchesPrevProfile && !isOrphanedPreseeded && !isBlankOrWhitespace) {
            return ws;
          }

          return rawEor !== cleanName
            ? { ...ws, engineerOfRecord: cleanName, updatedAt: saveTimestamp }
            : ws;
        }),
      };
    });

    civilLab.updateUserProfile({
      name: cleanName,
      title: cleanTitle,
      organization: cleanOrg,
      licenseNo: cleanLic,
      email: cleanEmail,
      phone: cleanPhone,
      location: cleanAddr,
    });
    civilLab.updatePdfPreset({
      signatoryName: cleanName
        ? `${cleanName}${cleanTitle ? `, ${cleanTitle.split(' ')[0]}` : ''}`
        : '',
    });

    const prevSyncedName = prevSyncedProfileNameRef.current;
    const wbEng =
      typeof workbench.projectMetadata?.engineerName === 'string'
        ? workbench.projectMetadata.engineerName.trim()
        : '';
    if (
      cleanName === ''
        ? wbEng === prevSyncedName || /prokash\s*biswas|lead structural engineer/i.test(wbEng)
        : wbEng === '' || (prevSyncedName.length > 0 && wbEng === prevSyncedName)
    ) {
      if (wbEng !== cleanName) {
        workbench.updateProjectMetadata({ engineerName: cleanName });
      }
    }
    prevSyncedProfileNameRef.current = cleanName;

    setToastBanner(
      cleanName
        ? `Saved credentials for ${cleanName}. Reports updated.`
        : 'Saved engineer profile deleted. Enter new details anytime.'
    );
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
    const currentMod = activeWorkspace.activeModule;
    const currentModPopulated =
      (currentMod === 'concrete-materials' && Boolean(payload.concreteMaterials)) ||
      (currentMod === 'concrete-mix' && Boolean(payload.concreteMix)) ||
      (currentMod === 'rate-analysis' && Boolean(payload.rateAnalysis)) ||
      (currentMod === 'boq-estimator' && Boolean(payload.boq)) ||
      (currentMod === 'beam-analysis' && Boolean(payload.beam)) ||
      (currentMod === 'continuous-beam' && Boolean(payload.continuousBeam)) ||
      (currentMod === 'frame-truss-2d' && Boolean(payload.frameTruss2d)) ||
      (currentMod === 'section-analyzer' && Boolean(payload.sectionAnalyzer)) ||
      (currentMod === 'rc-column-design' && Boolean(payload.rcColumn)) ||
      (currentMod === 'strut-and-tie' && Boolean(payload.strutAndTie)) ||
      (currentMod === 'bearing-capacity' && Boolean(payload.bearing)) ||
      (currentMod === 'pile-capacity' && Boolean(payload.pile)) ||
      (currentMod === 'open-channel' && Boolean(payload.channel)) ||
      (currentMod === 'pipe-hydraulics' && Boolean(payload.pipe)) ||
      (currentMod === 'rebar-bbs' && Boolean(payload.rebarBbs)) ||
      (currentMod === 'masonry-finishes' && Boolean(payload.masonry)) ||
      (currentMod === 'earthwork-alignment' && Boolean(payload.earthwork)) ||
      (currentMod === 'surveying-suite' && Boolean(payload.surveying));

    updateActiveWorkspace((ws) => {
      const nextWs: CivilWorkspace = { ...ws };
      if (payload.targetModule && !currentModPopulated) {
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
      if (payload.frameTruss2d) {
        nextWs.frameTruss2d = { ...(nextWs.frameTruss2d || defaultFrameTruss2d), ...payload.frameTruss2d } as any;
      }
      if (payload.sectionAnalyzer) {
        nextWs.sectionAnalyzer = { ...(nextWs.sectionAnalyzer || defaultSectionAnalyzer), ...payload.sectionAnalyzer } as any;
      }
      if (payload.rcColumn) {
        nextWs.rcColumn = { ...(nextWs.rcColumn || defaultRcColumn), ...payload.rcColumn } as any;
      }
      if (payload.strutAndTie) {
        nextWs.strutAndTie = { ...(nextWs.strutAndTie || defaultStrutAndTie), ...payload.strutAndTie } as any;
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
    if (payload.targetModule && !currentModPopulated) {
      navigateToModule(payload.targetModule);
    }
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
    updateActiveWorkspace((ws) => ({
      ...ws,
      boq: {
        ...ws.boq,
        items: [],
      },
    }));
    setToastBanner('Cleared all takeoff items from project.');
  };

  // Apply Calculated Unit Rate from Rate Analysis to BOQ
  const handleApplyRateToBOQ = () => {
    const rateEnv = (activeModule === 'rate-analysis' ? currentEnvelope : computeRateAnalysis(activeWorkspace.rateAnalysis)) as CalculationEnvelope<RateAnalysisResult>;
    if (!rateEnv.result) return;
    const rateRes = rateEnv.result;
    const basisUnit = rateRes.basisUnitLabel || 'm³';

    const existingIndex = activeWorkspace.boq.items.findIndex((it) => {
      const d = it.description.toLowerCase();
      if (rateRes.workType === 'brickwork-125mm-1-4') return d.includes('125mm') || d.includes('partition');
      if (rateRes.workType === 'brickwork-1-6') return d.includes('250mm') || (it.category === 'masonry' && !d.includes('125mm'));
      if (rateRes.workType === 'rebar-fabrication') return it.category === 'rebar' || d.includes('rebar');
      if (rateRes.workType === 'pcc-1-3-6') return d.includes('pcc') || d.includes('1:3:6') || d.includes('lean');
      if (rateRes.workType === 'patent-stone-1-2-4') return d.includes('patent') || d.includes('screed');
      if (rateRes.workType === 'plaster-1-4') return d.includes('plaster');
      return d.includes(rateRes.workType.toLowerCase()) || d.includes('rcc');
    });

    const existingItem = existingIndex >= 0 ? activeWorkspace.boq.items[existingIndex] : null;
    let calculatedRate = rateRes.unitRatePerM3;
    let unitLabel: string = basisUnit;
    if (existingItem) {
      if (basisUnit === 'm²') {
        calculatedRate = existingItem.unit === 'sft' ? rateRes.unitRatePerCft : rateRes.unitRatePerM3;
        unitLabel = existingItem.unit === 'sft' ? 'sft' : 'm²';
      } else if (basisUnit === 'Ton') {
        calculatedRate = existingItem.unit === 'kg' ? Number((rateRes.unitRatePerM3 / 1000).toFixed(2)) : rateRes.unitRatePerM3;
        unitLabel = existingItem.unit === 'kg' ? 'kg' : 'Ton';
      } else {
        calculatedRate = existingItem.unit === 'cft' ? rateRes.unitRatePerCft : rateRes.unitRatePerM3;
        unitLabel = existingItem.unit === 'cft' ? 'cft' : 'm³';
      }
    }

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
      setToastBanner(`Updated existing BOQ item rate with ${rateRes.currencySymbol} ${calculatedRate.toFixed(2)}/${unitLabel}`);
    } else {
      const defaultUnit = basisUnit === 'm²' ? 'm2' : basisUnit === 'Ton' ? 'ton' : 'm3';
      const newItem: TakeoffLineItem = {
        id: `takeoff-${generateUUID().slice(0, 8)}`,
        itemNo: `${activeWorkspace.boq.items.length + 1}.01`,
        description: rateRes.workDescription,
        category: rateRes.workType.includes('brick')
          ? 'masonry'
          : rateRes.workType === 'rebar-fabrication'
            ? 'rebar'
            : rateRes.workType === 'plaster-1-4' || rateRes.workType === 'patent-stone-1-2-4'
              ? 'finishing'
              : 'superstructure',
        numberOfMembers: 1,
        lengthM: 10.0,
        widthM: basisUnit === 'Ton' ? 0 : basisUnit === 'm²' ? 3.0 : 0.5,
        heightM: basisUnit === 'm³' ? 0.5 : 0,
        deductionQty: 0,
        unit: defaultUnit,
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
      setToastBanner(`Added Rate Analysis item to BOQ sheet (${rateRes.currencySymbol} ${calculatedRate.toFixed(2)}/${basisUnit})`);
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
  useEffect(() => {
    setActiveReportQr(null);
  }, [activeModule, activeWorkspace.id, activeWorkspace.updatedAt, currentEnvelope.status]);

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
    if (activeModule === 'testing-lab-qaqc') {
      const [{ TESTING_LAB_TESTS }, engine] = await Promise.all([
        import('./data/testingLabCatalog'),
        import('./utils/testingLabEngine'),
      ]);
      const labState = activeWorkspace.testingLab;
      const test =
        (labState?.activeTestId && TESTING_LAB_TEST_MAP[labState.activeTestId]) ||
        TESTING_LAB_TESTS[0];
      const inputs = {
        ...engine.getDefaultInputsForTest(test),
        ...(labState?.draftInputsByTestId?.[test.id] || {}),
      };
      const checklistStates = test.checklistItems
        ? {
            ...engine.getDefaultChecklistStates(test),
            ...(labState?.draftChecklistsByTestId?.[test.id] || {}),
          }
        : undefined;
      const evaluation = engine.evaluateLabTest(test.id, inputs, checklistStates);
      const html = await engine.buildPrintableLabCertificateHtml({
        test,
        inputs,
        evaluation,
        sampleRef: labState?.savedRecords?.[0]?.sampleRef || 'LAB-SMP-001',
        locationGrid: labState?.savedRecords?.[0]?.locationGrid || activeWorkspace.siteLocation || 'Not Specified',
        remarks: '',
        workspace: activeWorkspace,
        userProfile,
        checklistStates,
      });
      printEl.innerHTML = html;
      printEl.className = 'print:block bg-white text-slate-900 p-6 font-sans m-0 leading-relaxed';
      return;
    }

    const meta = MODULE_META[activeModule];
    const eqInfo = getGoverningEquations(activeModule);
    const nowStr = new Date().toLocaleString();

    // Lazily ensure Scannable QR Code containing document reference & project metadata
    const qrResult = activeReportQr || (await getOrGenerateReportQr());
    const docId = qrResult.documentId;

    const captureRoot = document.getElementById('pb-print-capture-source');
    const kpiEl = captureRoot?.querySelector('.print-capture-kpi-summary');
    const tableEl =
      captureRoot?.querySelector('.print-capture-table') ||
      document.querySelector('.analytical-dense-table-container');
    const diagramEl =
      captureRoot?.querySelector('.print-capture-diagram') ||
      document.querySelector('.analytical-diagram-container');

    printEl.innerHTML = `
      <div class="space-y-6 font-sans text-slate-900 bg-white p-6 max-w-5xl mx-auto leading-relaxed">
        <div class="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4 print-avoid-break">
          <div class="flex items-center gap-3.5">
            <img src="${BRAND_LOGO_SRC}" alt="BD. CivilLab Official Brand Logo" class="w-14 h-14 rounded-xl object-contain border border-slate-300 shadow-xs shrink-0 bg-slate-900 p-1" />
            <div>
              <div class="text-2xl font-black font-sans tracking-tight text-blue-700">BD. CivilLab</div>
              <div class="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-600 mt-0.5">
                CALCULATE SMARTER. BUILD BETTER. · CERTIFIED ANALYTICAL WORKBENCH
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
            <div class="font-bold text-sm text-slate-900 mt-0.5">${activeWorkspace.name || 'Untitled Project'} [${activeWorkspace.projectCode || 'PRJ-001'}]</div>
            <div class="text-slate-600 mt-0.5">Location: ${activeWorkspace.siteLocation || 'Not Specified'} · Currency: ${activeWorkspace.currency}</div>
          </div>
          <div class="text-right">
            <div class="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Certified Prepared By</div>
            <div class="font-bold text-sm text-slate-900 mt-0.5">${userProfile.fullName || activeWorkspace.engineerOfRecord || 'Pending Signature'}</div>
            <div class="text-slate-600 mt-0.5">${userProfile.organization || 'Independent Practice'} · Reg: ${userProfile.licenseNumber || 'Pending License'}</div>
          </div>
        </div>

        ${
          kpiEl
            ? `<div class="p-4 border border-slate-300 rounded bg-white print-avoid-break">
                <div class="text-xs font-bold font-mono uppercase text-slate-600 mb-2 border-b pb-1">Executive KPI Output Summary &amp; Capacity Ratios</div>
                ${kpiEl.innerHTML}
              </div>`
            : ''
        }

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

        ${
          eqInfo && eqInfo.equations && eqInfo.equations.length > 0
            ? `<div class="border border-slate-300 rounded p-4 bg-slate-50/70 print-avoid-break space-y-2.5">
                <div class="flex items-center justify-between border-b border-slate-300 pb-1">
                  <div class="text-xs font-bold font-mono uppercase text-slate-700">Governing Equations &amp; Analytical Basis — ${eqInfo.category}</div>
                  <div class="text-[10px] font-mono font-bold text-blue-700">${eqInfo.codeStandard}</div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  ${eqInfo.equations
                    .slice(0, 4)
                    .map(
                      (eq) => `
                        <div class="p-2 bg-white border border-slate-200 rounded">
                          <div class="font-bold text-slate-900">${eq.name}</div>
                          <div class="font-mono text-blue-800 bg-blue-50/60 px-1.5 py-0.5 rounded my-1 break-all">${eq.formula}</div>
                          <div class="text-[10px] text-slate-600">${eq.description}</div>
                        </div>`
                    )
                    .join('')}
                </div>
                ${
                  eqInfo.assumptions && eqInfo.assumptions.length > 0
                    ? `<div class="text-[10px] font-mono text-slate-600 pt-1">
                        <strong>Key Engineering Assumptions:</strong> ${eqInfo.assumptions.slice(0, 3).join(' · ')}
                      </div>`
                    : ''
                }
              </div>`
            : ''
        }

        <div class="pt-6 border-t border-slate-300 space-y-4 print-avoid-break">
          <div class="grid grid-cols-3 gap-4 pt-2">
            <div class="border border-slate-300 rounded p-3 bg-slate-50/50">
              <div class="text-[9px] font-mono font-bold uppercase text-slate-500">1. Prepared By (Design)</div>
              <div class="h-10 border-b border-dashed border-slate-400 my-1.5"></div>
              <div class="text-[11px] font-bold text-slate-900">${userProfile.fullName || activeWorkspace.engineerOfRecord || 'Pending Signature'}</div>
              <div class="text-[9.5px] font-mono text-slate-600">Design Engineer · Date: ${nowStr.split(',')[0]}</div>
            </div>
            <div class="border border-slate-300 rounded p-3 bg-slate-50/50">
              <div class="text-[9px] font-mono font-bold uppercase text-slate-500">2. Checked By (QA / Peer Review)</div>
              <div class="h-10 border-b border-dashed border-slate-400 my-1.5"></div>
              <div class="text-[11px] font-bold text-slate-900">Pending QA Reviewer</div>
              <div class="text-[9.5px] font-mono text-slate-600">QA/QC Verification · Date: Pending</div>
            </div>
            <div class="border border-slate-300 rounded p-3 bg-slate-50/50">
              <div class="text-[9px] font-mono font-bold uppercase text-slate-500">3. Approved By (EOR)</div>
              <div class="h-10 border-b border-dashed border-slate-400 my-1.5"></div>
              <div class="text-[11px] font-bold text-slate-900">${userProfile.initials || 'EOR'} STAMP &amp; SEAL</div>
              <div class="text-[9.5px] font-mono text-slate-600">Reg: ${userProfile.licenseNumber || 'Pending License'} · Final Sign-Off</div>
            </div>
          </div>
          <div class="flex items-center justify-between text-[10px] font-mono text-slate-600">
            <div>Hash: <code>${qrResult.verificationHash}</code> · Portal: <code>https://civillab.bd/verify?doc=${docId}</code></div>
            <div>BD. CivilLab Certified Analytical Kernel</div>
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
    printEl.setAttribute('data-print-ready', 'true');
    document.body.classList.add('is-printing-report');

    const cleanUp = () => {
      window.removeEventListener('afterprint', cleanUp);
      setTimeout(() => {
        if (printEl) {
          printEl.removeAttribute('data-print-ready');
          printEl.innerHTML = '';
          printEl.className = 'hidden print:block bg-white text-slate-900';
        }
        document.body.classList.remove('is-printing-report');
      }, 600);
    };
    window.addEventListener('afterprint', cleanUp);
    setTimeout(() => {
      window.print();
    }, 100);
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

  // Browser Print event listeners for Ctrl+P and direct module window.print() triggers
  useEffect(() => {
    const handleBeforePrint = () => {
      const printEl = document.getElementById('pb-printable-report');
      if (!printEl) return;

      // If PrintPreviewModal, ArchitectureSubmittal, or QuickPrint already populated #pb-printable-report, keep it
      if (printEl.getAttribute('data-print-ready') === 'true' || printEl.innerHTML.trim().length > 0) {
        document.body.classList.add('is-printing-report');
        return;
      }

      // Check if the active module has a dedicated printable sheet (e.g., Office Docs, Requisition, RA Bill, Testing Lab)
      const modulePrintable = document.querySelector(
        '.screen-app-container .printable-document, .screen-app-container .print\\:block'
      ) as HTMLElement | null;

      if (modulePrintable && modulePrintable.innerHTML.trim().length > 0) {
        printEl.innerHTML = `<div class="p-6 bg-white text-slate-900 font-sans leading-relaxed">${modulePrintable.innerHTML}</div>`;
        printEl.className = 'print:block bg-white text-slate-900 p-6 font-sans m-0 leading-relaxed';
        document.body.classList.add('is-printing-report');
        return;
      }

      // Otherwise synchronously populate with the active module's certified engineering sheet
      void renderQuickPrintSheetToEl(printEl);
      document.body.classList.add('is-printing-report');
    };
    const handleAfterPrint = () => {
      setTimeout(() => {
        const printEl = document.getElementById('pb-printable-report');
        if (printEl) {
          printEl.removeAttribute('data-print-ready');
          printEl.innerHTML = '';
          printEl.className = 'hidden print:block bg-white text-slate-900';
        }
        document.body.classList.remove('is-printing-report');
      }, 600);
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
      pileEnv,
      surveyEnv,
      activeWorkspace.surveying
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
      const mixRes = currentEnvelope.result as ConcreteMixResult;
      if (!mixRes) return;
      const wcRatio = activeWorkspace.concrete.waterCementRatio || 0;
      const cementBags = mixRes.cementBags50Kg ?? mixRes.batchCementKg / 50;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'concrete-mix',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · ACI Mix Design (f'c=${activeWorkspace.concrete.targetStrengthMpa} MPa)`,
        notes: `w/c=${wcRatio.toFixed(2)}, Cement=${mixRes.batchCementKg.toFixed(1)} kg, Batch=${mixRes.batchVolumeM3} m³`,
        status: mixRes.status,
        keyMetrics: [
          { label: 'Cement', value: `${cementBags.toFixed(1)} bags`, unit: 'bags' },
          { label: 'Water/Cement', value: wcRatio.toFixed(2), unit: 'ratio' },
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
      const bbsRes = currentEnvelope.result as RebarBBSResult;
      if (!bbsRes) return;
      const stirrupWeightKg = (bbsRes.items || [])
        .filter(
          (it) =>
            it.shapeType === 'stirrup-135' ||
            it.shapeType === 'spiral' ||
            /stirrup|tie|link|ring|distribution/i.test(it.description)
        )
        .reduce((acc, it) => acc + (it.totalWeightKg || 0), 0);
      const mainBarWeightKg = Math.max(0, (bbsRes.totalSteelWeightKg || 0) - stirrupWeightKg);
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
          { label: 'Main Steel', value: mainBarWeightKg.toFixed(1), unit: 'kg' },
          { label: 'Stirrups/Ties', value: stirrupWeightKg.toFixed(1), unit: 'kg' },
        ],
        inputsSnapshot: { ...activeWorkspace.rebarBbs },
      };
    } else if (activeModule === 'boq-estimator') {
      const boqRes = currentEnvelope.result as any;
      if (!boqRes) return;
      const totalItems = boqRes.totalItemCount ?? (boqRes.items?.length || 0);
      const grandTotal = boqRes.grandTotalAmount ?? 0;
      const subtotal = boqRes.subtotalAmount ?? 0;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'boq-estimator',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Quantity Takeoff (${totalItems} Items)`,
        notes: `Total Grand Cost = ${boqRes.currency} ${Number(grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        status: boqRes.status,
        keyMetrics: [
          { label: 'Grand Total Cost', value: Number(grandTotal).toLocaleString(), unit: boqRes.currency || 'BDT' },
          { label: 'Line Items Count', value: String(totalItems), unit: 'items' },
          { label: 'Direct Works', value: Number(subtotal).toLocaleString(), unit: boqRes.currency || 'BDT' },
        ],
        inputsSnapshot: { ...activeWorkspace.boq },
      };
    } else if (activeModule === 'rate-analysis') {
      const rateRes = currentEnvelope.result as RateAnalysisResult;
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
          { label: 'Basic Material Cost', value: (rateRes.materialsCost ?? 0).toFixed(2), unit: rateRes.currencySymbol },
        ],
        inputsSnapshot: { ...activeWorkspace.rateAnalysis },
      };
    } else if (activeModule === 'concrete-materials') {
      const matRes = currentEnvelope.result as ConcreteMaterialResult;
      if (!matRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'concrete-materials',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Concrete Materials (${matRes.code})`,
        notes: `Wet Vol=${matRes.wetVolumeM3.toFixed(2)} m³, Cement=${matRes.cementBags50Kg.toFixed(1)} bags, Sand=${matRes.sandCft.toFixed(1)} cft, Coarse=${matRes.aggregateCft.toFixed(1)} cft`,
        status: matRes.status,
        keyMetrics: [
          { label: 'Wet Volume', value: matRes.wetVolumeM3.toFixed(2), unit: 'm³' },
          { label: 'Cement (50kg)', value: matRes.cementBags50Kg.toFixed(1), unit: 'bags' },
          { label: 'Fine Sand', value: matRes.sandCft.toFixed(1), unit: 'cft' },
          { label: 'Coarse Agg', value: matRes.aggregateCft.toFixed(1), unit: 'cft' },
        ],
        inputsSnapshot: { ...activeWorkspace.concreteMaterials },
      };
    } else if (activeModule === 'masonry-finishes') {
      const masRes = currentEnvelope.result as MasonryResult;
      if (!masRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'masonry-finishes',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Masonry & Finishes`,
        notes: `Net Wall=${masRes.netWallVolumeM3.toFixed(2)} m³, Bricks=${masRes.bricksWithWastageCount}, Mortar Cement=${masRes.mortarCementBags50Kg.toFixed(1)} bags`,
        status: masRes.status,
        keyMetrics: [
          { label: 'Bricks (incl. wastage)', value: String(masRes.bricksWithWastageCount), unit: 'nos' },
          { label: 'Mortar Cement', value: masRes.mortarCementBags50Kg.toFixed(1), unit: 'bags' },
          { label: 'Plaster Area', value: masRes.plasterAreaM2.toFixed(1), unit: 'm²' },
          { label: 'Floor Tiles', value: `${masRes.tileBoxesCount} boxes`, unit: 'boxes' },
        ],
        inputsSnapshot: { ...activeWorkspace.masonry },
      };
    } else if (activeModule === 'earthwork-alignment') {
      const ewRes = currentEnvelope.result as EarthworkResult;
      if (!ewRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'earthwork-alignment',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Earthwork & Alignment (${ewRes.calculationType})`,
        notes: `Bank=${ewRes.bankVolumeM3.toFixed(1)} m³, Loose=${ewRes.looseVolumeM3.toFixed(1)} m³, Trips=${ewRes.haulTruckTripsCount10M3}`,
        status: ewRes.status,
        keyMetrics: [
          { label: 'Bank Volume', value: ewRes.bankVolumeM3.toFixed(1), unit: 'm³' },
          { label: 'Loose Volume', value: ewRes.looseVolumeM3.toFixed(1), unit: 'm³' },
          { label: 'Compacted Vol', value: ewRes.compactedVolumeM3.toFixed(1), unit: 'm³' },
          { label: 'Dump Truck Trips', value: String(ewRes.haulTruckTripsCount10M3), unit: 'trips' },
        ],
        inputsSnapshot: { ...activeWorkspace.earthwork },
      };
    } else if (activeModule === 'unit-converter') {
      const convRes = currentEnvelope.result as any;
      const conv = activeWorkspace.converter;
      if (!convRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'unit-converter',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Unit Converter (${conv.category})`,
        notes: `${conv.inputValue} ${conv.fromUnit} = ${convRes.formattedValue ?? convRes.outputValue ?? ''} ${conv.toUnit}`,
        status: 'nominal',
        keyMetrics: [
          { label: 'Input Value', value: String(conv.inputValue), unit: conv.fromUnit },
          { label: 'Converted Output', value: String(convRes.formattedValue ?? convRes.outputValue ?? ''), unit: conv.toUnit },
          { label: 'Category', value: conv.category, unit: 'dimension' },
        ],
        inputsSnapshot: { ...conv },
      };
    } else if (activeModule === 'surveying-suite') {
      const surv = activeWorkspace.surveying;
      if (!surv) return;
      const area = surv.computedAreaSqM || 0;
      const vol = surv.computedExcavationVolumeM3 || 0;
      const stationsCount = surv.stations?.length || 0;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'surveying-suite',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Surveying & Land Area (${surv.method})`,
        notes: `Polygon Area=${area.toFixed(2)} m², Cut/Fill Volume=${vol.toFixed(2)} m³, ${stationsCount} Leveling Stations`,
        status: 'nominal',
        keyMetrics: [
          { label: 'Land Polygon Area', value: area.toFixed(2), unit: 'm²' },
          { label: 'Excavation Volume', value: vol.toFixed(2), unit: 'm³' },
          { label: 'Leveling Stations', value: String(stationsCount), unit: 'stations' },
        ],
        inputsSnapshot: { ...surv },
      };
    } else if (activeModule === 'testing-lab-qaqc') {
      const labState = activeWorkspace.testingLab || createDefaultTestingLabState();
      const test =
        (labState.activeTestId && TESTING_LAB_TEST_MAP[labState.activeTestId]) ||
        TESTING_LAB_TESTS[0];
      const inputs = {
        ...getDefaultInputsForTest(test),
        ...(labState.draftInputsByTestId?.[test.id] || {}),
      };
      const checklistStates = test.checklistItems
        ? {
            ...getDefaultChecklistStates(test),
            ...(labState.draftChecklistsByTestId?.[test.id] || {}),
          }
        : undefined;
      const evaluation = evaluateLabTest(test.id, inputs, checklistStates);
      const sampleRef = labState.savedRecords?.[0]?.sampleRef || 'LAB-SMP-001';
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'testing-lab-qaqc',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · ${test.code}: ${test.title.en}`,
        notes: `${sampleRef} · ${evaluation.primaryMetricLabel.en}: ${evaluation.primaryValue} ${evaluation.primaryUnit} · Verdict: ${evaluation.verdict}`,
        status:
          evaluation.verdict === 'FAIL'
            ? 'critical'
            : evaluation.verdict === 'WARNING'
            ? 'warning'
            : 'nominal',
        keyMetrics: [
          { label: evaluation.primaryMetricLabel.en, value: evaluation.primaryValue, unit: evaluation.primaryUnit },
          { label: 'Sample Ref', value: sampleRef, unit: 'ID' },
          { label: 'QA/QC Verdict', value: evaluation.verdict, unit: test.code },
        ],
        inputsSnapshot: { ...labState },
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
    } else if (activeModule === 'frame-truss-2d') {
      const ftRes = currentEnvelope.result as FrameTruss2DResult;
      if (!ftRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'frame-truss-2d',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · 2D Frame & Truss (${ftRes.nodeCount}N/${ftRes.memberCount}M)`,
        notes: `${ftRes.analysisMode === 'second-order-p-delta' ? '2nd-Order P-Δ' : '1st-Order'}, Δ_max=${ftRes.maxDisplacementMm.toFixed(2)} mm, α_cr=${Number.isFinite(ftRes.criticalBucklingFactorAlphaCr) ? ftRes.criticalBucklingFactorAlphaCr.toFixed(2) : '∞'}`,
        status: ftRes.status,
        keyMetrics: [
          { label: 'Max Disp', value: ftRes.maxDisplacementMm.toFixed(2), unit: 'mm' },
          { label: 'Max Moment', value: ftRes.maxAbsMomentKnm.toFixed(1), unit: 'kN·m' },
          { label: 'Buckling α_cr', value: Number.isFinite(ftRes.criticalBucklingFactorAlphaCr) ? ftRes.criticalBucklingFactorAlphaCr.toFixed(2) : '∞', unit: 'ratio' },
          { label: 'DCR', value: `${(ftRes.utilizationRatio * 100).toFixed(1)}%`, unit: 'ratio' },
        ],
        inputsSnapshot: { ...(activeWorkspace.frameTruss2d || defaultFrameTruss2d) },
      };
    } else if (activeModule === 'section-analyzer') {
      const saRes = currentEnvelope.result as SectionAnalyzerResult;
      if (!saRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'section-analyzer',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Section Analyzer (${saRes.presetName})`,
        notes: `${saRes.classification.classLabel}, σ_vM=${saRes.vonMisesMaxMpa.toFixed(1)} MPa, M_N,y,Rd=${saRes.mNyReducedRdKnm.toFixed(1)} kN·m`,
        status: saRes.status,
        keyMetrics: [
          { label: 'Class', value: `Class ${saRes.classification.sectionClass}`, unit: saRes.designCode },
          { label: 'Peak σ_vM', value: saRes.vonMisesMaxMpa.toFixed(1), unit: 'MPa' },
          { label: 'M_N,y,Rd', value: saRes.mNyReducedRdKnm.toFixed(1), unit: 'kN·m' },
          { label: 'DCR', value: `${(saRes.governingDcr * 100).toFixed(1)}%`, unit: 'ratio' },
        ],
        inputsSnapshot: { ...(activeWorkspace.sectionAnalyzer || defaultSectionAnalyzer) },
      };
    } else if (activeModule === 'rc-column-design') {
      const colRes = currentEnvelope.result as RcColumnDesignResult;
      if (!colRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'rc-column-design',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · RC Column ${colRes.widthB_Mm}×${colRes.depthH_Mm} (${colRes.designCode})`,
        notes: `${colRes.totalBarCount}-Ø${colRes.longitudinalBarDiaMm}, Pu=${colRes.axialLoadPu_Kn} kN, Bresler DCR=${(colRes.breslerContourDcr * 100).toFixed(1)}%`,
        status: colRes.status === 'zero_baseline' ? 'nominal' : colRes.status,
        keyMetrics: [
          { label: 'Section', value: `${colRes.widthB_Mm}×${colRes.depthH_Mm}`, unit: 'mm' },
          { label: 'φM_nx', value: colRes.xAxis.phiMnAtPuKnm.toFixed(1), unit: 'kN·m' },
          { label: 'Bresler DCR', value: `${(colRes.breslerContourDcr * 100).toFixed(1)}%`, unit: 'ratio' },
          { label: 'Gov DCR', value: `${(colRes.governingDcr * 100).toFixed(1)}%`, unit: 'ratio' },
        ],
        inputsSnapshot: { ...(activeWorkspace.rcColumn || defaultRcColumn) },
      };
    } else if (activeModule === 'strut-and-tie') {
      const stmRes = currentEnvelope.result as StrutAndTieResult;
      if (!stmRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'strut-and-tie',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · STM (${stmRes.presetName})`,
        notes: `Partial Scope · Max Strut ${stmRes.maxCompressionStrutKn.toFixed(1)} kN, Max Tie +${stmRes.maxTensionTieKn.toFixed(1)} kN, As,req=${stmRes.totalRequiredTieSteelMm2.toFixed(0)} mm²`,
        status: stmRes.status,
        keyMetrics: [
          { label: 'Max Strut', value: stmRes.maxCompressionStrutKn.toFixed(1), unit: 'kN' },
          { label: 'Max Tie', value: `+${stmRes.maxTensionTieKn.toFixed(1)}`, unit: 'kN' },
          { label: 'Req As,tie', value: stmRes.totalRequiredTieSteelMm2.toFixed(0), unit: 'mm²' },
          { label: 'DCR', value: `${(stmRes.governingDcr * 100).toFixed(1)}%`, unit: 'ratio' },
        ],
        inputsSnapshot: { ...(activeWorkspace.strutAndTie || defaultStrutAndTie) },
      };
    } else if (activeModule === 'pile-capacity') {
      const pileRes = currentEnvelope.result as PileCapacityResult;
      if (!pileRes) return;
      newRecord = {
        id: newId,
        workspaceId: activeWorkspace.id,
        moduleId: 'pile-capacity',
        timestamp: now,
        title: `${activeWorkspace.projectCode} · Pile Capacity (D=${activeWorkspace.pile?.diameterM ?? 0}m, L=${activeWorkspace.pile?.lengthM ?? 0}m)`,
        notes: `Q_ult=${pileRes.ultimateCapacityKn.toFixed(1)} kN, Q_all=${pileRes.allowableCapacityKn.toFixed(1)} kN (FS=${activeWorkspace.pile?.factorOfSafety ?? 0})`,
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
        notes: `Hazen-Williams C=${activeWorkspace.pipe?.hazenWilliamsC ?? 0}, Head Loss=${pipeRes.totalHeadLossM.toFixed(2)} m, V=${pipeRes.velocityMps.toFixed(2)} m/s`,
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
      name: data.name.trim() || 'Untitled Project',
      projectCode: data.code.trim() || `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      siteLocation: data.site.trim(),
      engineerOfRecord: data.engineer.trim() || userProfile.fullName || '',
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
              siteLocation: data.site.trim(),
              engineerOfRecord: data.engineer.trim(),
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
    setAppState((prev) => ({
      ...prev,
      calculationHistory: isProjectOnly
        ? prev.calculationHistory.filter((item) => item.workspaceId !== activeWorkspace.id)
        : [],
    }));
    setToastBanner('Cleared calculation history ledger.');
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
    const fresh = clearAndResetStorage('clean');
    setAppState(fresh);
    setToastBanner('Reset storage to clean initial state.');
    refreshIdbStats();
  };

  const handleLoadDemoDataset = () => {
    const demo = clearAndResetStorage('demo');
    setAppState(demo);
    setToastBanner('Loaded Padma River Viaduct engineering demo dataset.');
    refreshIdbStats();
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
    if ((currentEnvelope.status as string) === 'zero_baseline') {
      return (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs font-mono font-bold text-amber-700 dark:text-amber-300"
        >
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>0 Baseline Active — Enter dimensions or loads to compute</span>
        </div>
      );
    }
    if (currentEnvelope.status === 'invalid') {
      return (
        <div role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-error)]">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>Execution Blocked ({currentEnvelope.issues.length} Errors)</span>
        </div>
      );
    }
    if (currentEnvelope.status === 'warning') {
      return (
        <div role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Notice / Serviceability Limits ({currentEnvelope.issues.length} warnings)</span>
        </div>
      );
    }
    return (
      <div role="status" aria-live="polite" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--md-sys-color-primary)]">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
        <span>Nominal / Valid Envelope (All Constraints Satisfied)</span>
      </div>
    );
  };

  const handleCopySummary = () => {
    const capStr = capacityInfo ? `DCR: ${capacityInfo.percentage.toFixed(1)}% (${capacityInfo.status.toUpperCase()})` : '';
    const textToCopy = `[BD. CivilLab Certified Submittal]
Project: ${activeWorkspace.name} (${activeWorkspace.projectCode})
Module: ${MODULE_META[activeModule].label}
Governing Code: ${MODULE_META[activeModule].codeStandard}
Location: ${activeWorkspace.siteLocation || 'Not Set'}
Engineer of Record: ${userProfile.fullName || activeWorkspace.engineerOfRecord || 'Not Set'}
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
            sunlightMode={sunlightMode}
            onToggleSunlightMode={() => {
              setSunlightMode((prev) => !prev);
              triggerCelebration(
                !sunlightMode ? 'Field Sunlight Mode Enabled' : 'Standard Contrast Restored',
                !sunlightMode
                  ? 'Pure black-on-white high-contrast enabled for outdoor glare.'
                  : 'Standard theme restored.',
                'info'
              );
            }}
            onNavigateHome={() => navigateToDashboard('home')}
            isHomeActive={civilLab.activePage === 'home' && isDashboardView}
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
            onOpenMobile={() => setMobileDrawerOpen(true)}
            isCollapsed={appState.sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            activeModule={activeModule}
            activeSubAction={activeModule === 'testing-lab-qaqc' ? activeWorkspace.testingLab?.activeDomainId : undefined}
            isDashboardActive={isDashboardView}
            isHomeActive={civilLab.activePage === 'home' && isDashboardView}
            onSelectDashboard={() => navigateToDashboard('home')}
            onSelectModule={(id, subAction) => navigateToModule(id, subAction)}
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
            onOpenProfileModal={handleOpenProfileModal}
            unitSystemPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'}
            onSelectUnitPreset={handleSelectUnitPreset}
            onSelectTheme={handleThemeChange}
            engineerDisplayName={userProfile.fullName}
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
                  <div>Location: <strong>{activeWorkspace.siteLocation || 'Not Specified'}</strong></div>
                  <div>Module: <strong>{MODULE_META[activeModule].label}</strong></div>
                  <div>Code Standard: {MODULE_META[activeModule].codeStandard}</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between items-center text-xs font-mono">
                <div>
                  Engineer of Record: <strong>{userProfile.fullName || activeWorkspace.engineerOfRecord || 'Not Specified'}</strong>
                  {userProfile.licenseNumber && ` · PE Lic: ${userProfile.licenseNumber}`}
                  {userProfile.organization && ` · ${userProfile.organization}`}
                </div>
                <div className="flex flex-col items-end">
                  {userProfile.licenseNumber && (
                    <div className="mt-2 text-center w-56 border-t border-black pt-1">
                      <div className="text-[10px] font-bold text-black uppercase">
                        {userProfile.initials || 'EOR'} OFFICIAL CERTIFICATION STAMP
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
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                onOpenVerifySubmittal={() => setVerifySubmittalModalOpen(true)}
                onSelectUnitPreset={handleSelectUnitPreset}
                calculationHistory={appState.calculationHistory}
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
                    Loc: {activeWorkspace.siteLocation || 'Not Set'}
                  </span>
                  <span className="text-[var(--md-sys-color-outline)]">·</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    Eng: {userProfile.fullName || activeWorkspace.engineerOfRecord || 'Not Set'}
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

              {/* Status, Worked Examples, Unit Quick-Toggle & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {renderStatusBadge()}

                {(() => {
                  const workedExamplesMap: Partial<Record<EngineeringModuleId, WorkedExampleEntry[]>> = {
                    'beam-analysis': BEAM_WORKED_EXAMPLES,
                    'continuous-beam': CONTINUOUS_BEAM_WORKED_EXAMPLES,
                    'rate-analysis': RATE_ANALYSIS_WORKED_EXAMPLES,
                    'boq-estimator': BOQ_ESTIMATOR_WORKED_EXAMPLES,
                    'concrete-materials': CONCRETE_MATERIALS_WORKED_EXAMPLES,
                    'rebar-bbs': REBAR_BBS_WORKED_EXAMPLES,
                    'masonry-finishes': MASONRY_WORKED_EXAMPLES,
                    'earthwork-alignment': EARTHWORK_WORKED_EXAMPLES,
                    'bearing-capacity': BEARING_WORKED_EXAMPLES,
                    'pile-capacity': PILE_WORKED_EXAMPLES,
                    'concrete-mix': CONCRETE_MIX_WORKED_EXAMPLES,
                    'open-channel': OPEN_CHANNEL_WORKED_EXAMPLES,
                    'pipe-hydraulics': PIPE_HYDRAULICS_WORKED_EXAMPLES,
                    'frame-truss-2d': FRAME_TRUSS_WORKED_EXAMPLES,
                    'section-analyzer': SECTION_ANALYZER_WORKED_EXAMPLES,
                    'rc-column-design': RC_COLUMN_WORKED_EXAMPLES,
                    'strut-and-tie': STRUT_AND_TIE_WORKED_EXAMPLES,
                  };
                  const currentExList = workedExamplesMap[activeModule];
                  if (!currentExList || currentExList.length === 0) return null;

                  return (
                    <div className="relative" ref={workedExamplesRef}>
                      <button
                        type="button"
                        onClick={() => setWorkedExamplesMenuOpen((prev) => !prev)}
                        className="min-h-[34px] px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-1.5 transition-colors cursor-pointer"
                        aria-expanded={workedExamplesMenuOpen}
                        aria-haspopup="true"
                        title="Load verified textbook, PWD & project worked examples"
                      >
                        <BookOpenCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                        <span>Worked Examples</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${workedExamplesMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {workedExamplesMenuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-1.5 w-80 max-w-[90vw] rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1.5 z-30 space-y-1 text-xs font-sans"
                        >
                          <div className="px-2.5 py-1.5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--md-sys-color-primary)]">
                              Verified Benchmarks &amp; Examples
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const shareUrl = buildWorkedExampleUrl(
                                  activeModule as DeepLinkModuleId,
                                  currentExList[0].id,
                                  activeModule === 'beam-analysis' ? activeWorkspace.beam : undefined
                                );
                                navigator.clipboard?.writeText(shareUrl);
                                setWorkedExamplesMenuOpen(false);
                                triggerCelebration('Shareable Link Copied', 'URL copied with active engineering example', 'info');
                              }}
                              className="text-[10px] font-mono font-semibold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                              title="Copy shareable URL for current state"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Copy URL</span>
                            </button>
                          </div>

                          {currentExList.map((ex: WorkedExampleEntry) => (
                            <button
                              key={ex.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setWorkedExamplesMenuOpen(false);
                                if (ex.module === 'beam-analysis') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    beam: { ...ws.beam, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('beam-analysis', ex.id, ex.params));
                                } else if (ex.module === 'continuous-beam') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    continuousBeam: ex.params,
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('continuous-beam', ex.id));
                                } else if (ex.module === 'rate-analysis') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    rateAnalysis: { ...ws.rateAnalysis, ...ex.params },
                                    ...(ex.marketRates
                                      ? {
                                          marketRates: {
                                            ...(ws.marketRates || createDefaultMasterMarketRates()),
                                            ...ex.marketRates,
                                          },
                                        }
                                      : {}),
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('rate-analysis', ex.id));
                                } else if (ex.module === 'boq-estimator') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    boq: { ...ws.boq, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('boq-estimator', ex.id));
                                } else if (ex.module === 'concrete-materials') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    concreteMaterials: { ...ws.concreteMaterials, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('concrete-materials', ex.id));
                                } else if (ex.module === 'rebar-bbs') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    rebarBbs: { ...ws.rebarBbs, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('rebar-bbs', ex.id));
                                } else if (ex.module === 'masonry-finishes') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    masonry: { ...ws.masonry, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('masonry-finishes', ex.id));
                                } else if (ex.module === 'earthwork-alignment') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    earthwork: { ...ws.earthwork, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('earthwork-alignment', ex.id));
                                } else if (ex.module === 'bearing-capacity') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    bearing: { ...ws.bearing, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('bearing-capacity', ex.id));
                                } else if (ex.module === 'pile-capacity') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    pile: { ...(ws.pile || createDefaultPileCapacity()), ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('pile-capacity', ex.id));
                                } else if (ex.module === 'concrete-mix') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    concrete: { ...ws.concrete, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('concrete-mix', ex.id));
                                } else if (ex.module === 'open-channel') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    channel: { ...ws.channel, ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('open-channel', ex.id));
                                } else if (ex.module === 'pipe-hydraulics') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    pipe: { ...(ws.pipe || createDefaultPipeHydraulics()), ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('pipe-hydraulics', ex.id));
                                } else if (ex.module === 'frame-truss-2d') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    frameTruss2d: ex.params,
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('frame-truss-2d', ex.id));
                                } else if (ex.module === 'section-analyzer') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    sectionAnalyzer: { ...(ws.sectionAnalyzer || createDefaultSectionAnalyzer()), ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('section-analyzer', ex.id));
                                } else if (ex.module === 'rc-column-design') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    rcColumn: { ...(ws.rcColumn || createDefaultRcColumnDesign()), ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('rc-column-design', ex.id));
                                } else if (ex.module === 'strut-and-tie') {
                                  updateActiveWorkspace((ws) => ({
                                    ...ws,
                                    strutAndTie: { ...(ws.strutAndTie || createDefaultStrutAndTie()), ...ex.params },
                                  }));
                                  window.history.replaceState({}, '', buildWorkedExampleUrl('strut-and-tie', ex.id));
                                }
                                triggerCelebration(
                                  `Loaded Example: ${ex.title}`,
                                  'Press Undo anytime to restore previous workspace parameters',
                                  'celebrate'
                                );
                              }}
                              className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer space-y-0.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{ex.title}</span>
                                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] shrink-0">
                                  {ex.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-snug">
                                {ex.subtitle}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="h-4 w-px bg-[var(--md-sys-color-outline-variant)] mx-1 hidden sm:block" />

                {/* Dedicated 1-Click Unit System Quick-Toggle & 3-Preset Selector */}
                <UnitPresetSelector
                  currentPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'}
                  onSelectPreset={handleSelectUnitPreset}
                  onQuickToggle={handleQuickToggleUnitSystem}
                  showQuickToggle={true}
                  isTransitioning={isUnitSystemTransitioning}
                />

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
                bearingFailed={capacityInfo?.status === 'critical' || (capacityInfo?.percentage != null && capacityInfo.percentage > 100)}
                onTransferBbsToBoq={handleTransferBbsToBoq}
                onTransferMixToBoq={handleTransferMixToBoq}
                onTransferBearingToFootingAndPit={handleTransferBearingToFootingAndPit}
                onTransferBearingToPile={handleTransferBearingToPile}
                onTransferBeamToRebar={handleTransferBeamToRebar}
                onTransferContinuousBeamToRebar={handleTransferContinuousBeamToRebar}
                onTransferRcColumnToRebar={handleTransferRcColumnToRebar}
                onTransferMixToMaterials={handleTransferMixToMaterials}
                onTransferMaterialsToBoq={handleTransferMaterialsToBoq}
                onTransferMasonryToBoq={handleTransferMasonryToBoq}
                onTransferPileToBoq={handleTransferPileToBoq}
                onTransferEarthworkToBoq={handleTransferEarthworkToBoq}
                onTransferPipeToBoq={handleTransferPipeToBoq}
                onApplyRateToBoq={handleApplyRateToBOQ}
                onSyncBoqToInventory={handleSyncBoqToInventory}
                onSyncMixToCubeTests={handleSyncMixToCubeTests}
                onGenerateRequisitionSlip={handleGenerateRequisitionFromModule}
                onTransferStmToRebarBbs={handleTransferStmToRebarBbs}
                currencySymbol={getCurrencySymbol(activeWorkspace.currency)}
                bbsSteelWeightKg={crossLinkMetrics.bbsSteelWeightKg}
                matConcreteVolumeM3={crossLinkMetrics.matConcreteVolumeM3}
                beamMaxMomentKnm={crossLinkMetrics.beamMaxMomentKnm}
                rcColWidthMm={crossLinkMetrics.rcColWidthMm}
                rcColDepthMm={crossLinkMetrics.rcColDepthMm}
                rcColBarCount={crossLinkMetrics.rcColBarCount}
                rcColBarDiaMm={crossLinkMetrics.rcColBarDiaMm}
                masonryNetVolumeM3={crossLinkMetrics.masonryNetVolumeM3}
                masonryBricksCount={crossLinkMetrics.masonryBricksCount}
                pileConcreteVolumeM3={crossLinkMetrics.pileConcreteVolumeM3}
                earthworkBankVolumeM3={crossLinkMetrics.earthworkBankVolumeM3}
                rateAnalysisUnitRate={crossLinkMetrics.rateAnalysisUnitRate}
                continuousBeamMaxMomentKnm={crossLinkMetrics.continuousBeamMaxMomentKnm}
                stmRequiredTieSteelMm2={crossLinkMetrics.stmRequiredTieSteelMm2}
              />
            </div>

            {/* Dedicated Full-Width Module Views (Surveying Suite & Site Management ERP) */}
            {activeModule === 'surveying-suite' ? (
              <motion.div
                key={`surveying-suite-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
                className="p-4 md:p-6 space-y-6"
              >
                <React.Suspense fallback={<ModuleSuspenseFallback title="Surveying & Land Measurement Suite" />}>
                  <SurveyingSuite
                    onQuickPrint={handleQuickPrintA4Report}
                    onExportPdf={handleDirectDownloadPdf}
                    onExportCsv={handleExportAnalyticalCsv}
                    onSaveToHistory={handleLogCalculationSnapshot}
                    activeWorkspace={activeWorkspace}
                    onUpdateSurveying={(surveyingUpdates) =>
                      updateActiveWorkspace((ws) => ({
                        ...ws,
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
                          ...(ws.surveying || {}),
                          ...surveyingUpdates,
                        },
                      }))
                    }
                    onTransferToEarthworkAndBoq={(landArea, cutFillVol, formationRL) =>
                      handleTransferSurveyingToBoq(landArea, cutFillVol, formationRL)
                    }
                  />
                </React.Suspense>
              </motion.div>
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
              <motion.div
                key={`site-management-hub-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
              >
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
              </motion.div>
            ) : activeModule === 'testing-lab-qaqc' ? (
              <motion.div
                key={`testing-lab-hub-${activeWorkspace.id}-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
                className="p-4 md:p-6"
              >
                <React.Suspense fallback={<ModuleSuspenseFallback title="Testing Lab & Field QA/QC" />}>
                  <TestingLabHub
                    activeWorkspace={activeWorkspace}
                    userProfile={userProfile}
                    onUpdateTestingLab={(updater) =>
                      updateActiveWorkspace((ws) => {
                        const prevLab = ws.testingLab || createDefaultTestingLabState();
                        return {
                          ...ws,
                          testingLab: updater(prevLab),
                        };
                      })
                    }
                    onSaveToHistory={handleLogCalculationSnapshot}
                    onSyncToCubeRegister={(payload) => {
                      const rec = addCubeTestRecord(payload);
                      triggerCelebration(
                        'Lab Test Pushed to Cube-Tests Register (SM-08)',
                        `Logged ${rec.pourId} (${rec.concreteGrade}, f'c=${rec.targetStrengthMPa} MPa, status: ${rec.status}) into Project Cube Crushing Register.`,
                        'celebrate'
                      );
                    }}
                    onNavigateToModule={navigateToModule}
                    onNotify={(msg) => setToastBanner(msg)}
                  />
                </React.Suspense>
              </motion.div>
            ) : activeModule === 'unit-converter' || civilLab.activePage === 'converter' ? (
              <motion.div
                key={`converter-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
                className="p-4 md:p-6"
              >
                <ConverterPage
                  activeWorkspace={activeWorkspace}
                  updateActiveWorkspace={updateActiveWorkspace}
                  customUnits={appState.customUnits}
                  onOpenCustomUnitsModal={() => setCustomUnitModalOpen(true)}
                />
              </motion.div>
            ) : (
              <>
              {/* Global Validation Issues & Inconsistency Alert Banner */}
              {currentEnvelope.issues && currentEnvelope.issues.length > 0 && (
                <div
                  role="alert"
                  className={`mx-4 md:mx-6 mt-4 rounded-xl border p-3.5 shadow-xs space-y-2 ${
                    currentEnvelope.issues.some((i: ValidationIssue) => i.severity === 'error')
                      ? 'border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/40 text-[var(--md-sys-color-error)]'
                      : 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
                      {currentEnvelope.issues.some((i: ValidationIssue) => i.severity === 'error') ? (
                        <XCircle className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        Validation Issues &amp; Inconsistency Alert ({currentEnvelope.issues.length})
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {currentEnvelope.issues.map((issue: ValidationIssue, idx: number) => (
                      <li
                        key={`${issue.field}-${idx}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--md-sys-color-surface)]/80 px-3 py-1.5 text-xs border border-current/15"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {issue.severity === 'error' ? (
                            <XCircle className="w-3.5 h-3.5 text-[var(--md-sys-color-error)] shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span className="font-mono font-bold text-[11px] uppercase opacity-80 shrink-0">
                            {issue.field}:
                          </span>
                          <span className="text-[var(--md-sys-color-on-surface)] font-medium">
                            {issue.message}
                          </span>
                        </div>
                        {issue.field && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetEl =
                                (document.getElementById(`unit-input-${issue.field}`) as HTMLElement | null) ||
                                (document.querySelector(`[data-field="${issue.field}"]`) as HTMLElement | null);
                              if (targetEl) {
                                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                setTimeout(() => {
                                  const inputEl = targetEl.matches('input, select, textarea')
                                    ? targetEl
                                    : (targetEl.querySelector('input, select, textarea') as HTMLElement | null);
                                  inputEl?.focus();
                                }, 180);
                              }
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-[var(--md-sys-color-surface-container-high)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] transition-colors cursor-pointer shrink-0"
                          >
                            Focus Field
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Parameter Input Form with Dedicated Input Header & Smooth Unit Transition */}
              <motion.section
                key={`inputs-pane-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
                className="lg:col-span-5 space-y-4"
              >
                {/* Dedicated Input Pane Card Header */}
                <div className="rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3.5 shadow-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                        Input Parameters • ইনপুট প্যারামিটার
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Zero Baseline Allowed
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleResetModuleToZero(activeModule)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--md-sys-color-surface)] hover:bg-rose-500/10 text-[var(--md-sys-color-on-surface)] hover:text-rose-600 dark:hover:text-rose-400 border border-[var(--md-sys-color-outline-variant)] hover:border-rose-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Clear all numeric fields for this module back to strict 0 baseline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Zero</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadStandardPresetForModule(activeModule)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[var(--md-sys-color-primary-container)]/50 hover:bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-primary)]/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Populate verified standard engineering preset for this module"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Standard Preset</span>
                    </button>
                  </div>
                </div>

                {/* MODULE: BOQ & QUANTITY TAKEOFF ESTIMATOR (Form State completely encapsulated) */}
                {activeModule === 'boq-estimator' && (
                  <BoqEstimatorInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    rateAnalysisResult={activeRateAnalysisResult}
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

                {/* MODULE: 2D FRAME & TRUSS + P-DELTA */}
                {activeModule === 'frame-truss-2d' && (
                  <FrameTruss2DInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                  />
                )}

                {/* MODULE: SECTION STRESSES & PLASTIC N-M INTERACTION */}
                {activeModule === 'section-analyzer' && (
                  <SectionAnalyzerInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    result={currentEnvelope.result as any}
                  />
                )}

                {/* MODULE: RC COLUMN N-M INTERACTION & SLENDERNESS */}
                {activeModule === 'rc-column-design' && (
                  <RcColumnInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    result={currentEnvelope.result as any}
                  />
                )}

                {/* MODULE: STRUT-AND-TIE MODEL (STM) DISCONTINUITY SOLVER */}
                {activeModule === 'strut-and-tie' && (
                  <StrutAndTieInputs
                    activeWorkspace={activeWorkspace}
                    updateActiveWorkspace={updateActiveWorkspace}
                    result={currentEnvelope.result as any}
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

              {/* Right Pane: Sticky Live Output Stage (Action Bar -> Executive KPIs & DCR -> CAD Diagram -> Tables & Steps) */}
              <motion.section
                key={`results-pane-${activeWorkspace.unitPreferences?.systemPreset || 'metric'}-${unitTransitionKey}`}
                initial={{ opacity: 0.35, y: 3, filter: 'blur(1px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.25 }}
                className="lg:col-span-7 lg:sticky lg:top-16 lg:self-start space-y-4"
              >
                {/* 1. CONSOLIDATED CALCULATION RESULTS ACTION BAR */}
                <div className="calculation-results-action-bar rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  {/* Left: View Mode Segmented Control */}
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] hidden sm:flex items-center gap-1.5 mr-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                      <span>View:</span>
                    </div>
                    <div
                      role="radiogroup"
                      aria-label="Analytical display mode"
                      className="inline-flex items-center p-0.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs font-mono"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={analyticalViewMode === 'graphical'}
                        onClick={() => setAnalyticalViewMode('graphical')}
                        className={`touch-target-48 sm:touch-target-auto px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          analyticalViewMode === 'graphical'
                            ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                        title="View CAD Visualizer and Dynamic Gauges"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Graphical</span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={analyticalViewMode === 'tabular'}
                        onClick={() => setAnalyticalViewMode('tabular')}
                        className={`touch-target-48 sm:touch-target-auto px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          analyticalViewMode === 'tabular'
                            ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                        title="View Itemized Analytical Schedule Table"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Table</span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={analyticalViewMode === 'steps'}
                        onClick={() => setAnalyticalViewMode('steps')}
                        className={`touch-target-48 sm:touch-target-auto px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          analyticalViewMode === 'steps'
                            ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                        title="View Step-by-Step Hand Calculation & Engine Cross-Verification"
                      >
                        <BookOpenCheck className="w-3.5 h-3.5" />
                        <span>Step-by-Step</span>
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={analyticalViewMode === 'both'}
                        onClick={() => setAnalyticalViewMode('both')}
                        className={`touch-target-48 sm:touch-target-auto px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          analyticalViewMode === 'both'
                            ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-xs font-bold'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                        title="Split / All View: CAD Diagram, Calculation Table & Step-by-Step Derivations"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span>Split</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Primary CTAs + Compact Export & Tools Dropdown */}
                  <div className="flex items-center gap-2">
                    {/* Primary CTA: Export PDF / Submittal */}
                    <button
                      type="button"
                      onClick={handleOpenPrintPreview}
                      className="touch-target-48 sm:touch-target-auto min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--md-sys-color-primary)] hover:opacity-95 text-[var(--md-sys-color-on-primary)] flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                      title="Open certified vector print preview & PDF submittal engine"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Export PDF</span>
                    </button>

                    {/* Primary Secondary CTA: Save Snapshot */}
                    <button
                      type="button"
                      onClick={handleLogCalculationSnapshot}
                      className="touch-target-48 sm:touch-target-auto min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title="Save verified analytical snapshot to History Ledger"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden sm:inline">Save Snapshot</span>
                    </button>

                    {/* Compact Export & Tools Dropdown */}
                    <div className="relative" ref={exportToolsRef}>
                      <button
                        type="button"
                        onClick={() => setExportToolsMenuOpen((prev) => !prev)}
                        className="touch-target-48 sm:touch-target-auto min-h-[36px] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] flex items-center gap-1.5 transition-colors cursor-pointer"
                        aria-expanded={exportToolsMenuOpen}
                        aria-haspopup="true"
                        title="More Export Options, Equations & Documentation"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export &amp; Tools</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportToolsMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {exportToolsMenuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-1.5 w-60 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-1.5 z-30 space-y-0.5 text-xs font-sans animate-in fade-in zoom-in-95 duration-150"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setExportToolsMenuOpen(false);
                              handleExportAnalyticalCsv();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                            <div>
                              <div className="font-semibold">Export CSV / Excel</div>
                              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">UTF-8 BOM engineering schedule</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setExportToolsMenuOpen(false);
                              handleQuickPrintA4Report();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <div className="font-semibold">Quick Print (1-Page A4)</div>
                              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Direct hardware print with QR</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setExportToolsMenuOpen(false);
                              handleCopySummary();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
                            <div>
                              <div className="font-semibold">{copiedSummary ? 'Copied to Clipboard' : 'Copy Summary'}</div>
                              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Structured submittal memo</div>
                            </div>
                          </button>

                          <div className="my-1 border-t border-[var(--md-sys-color-outline-variant)]" />

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setExportToolsMenuOpen(false);
                              setShowGoverningEquations(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Scale className="w-3.5 h-3.5 text-indigo-500" />
                            <div>
                              <div className="font-semibold">Governing Equations</div>
                              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">BNBC / ACI clauses &amp; theory</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setExportToolsMenuOpen(false);
                              setAboutToolDrawerOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Info className="w-3.5 h-3.5 text-amber-500" />
                            <div>
                              <div className="font-semibold">About This Tool</div>
                              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Documentation &amp; field guide</div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. EXECUTIVE KPI OUTPUT METRICS CARDS & DCR CAPACITY GAUGES FIRST */}
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
                {activeModule === 'frame-truss-2d' && currentEnvelope.result && (
                  <FrameTruss2DMetrics
                    result={currentEnvelope.result as any}
                  />
                )}
                {activeModule === 'section-analyzer' && currentEnvelope.result && (
                  <SectionAnalyzerMetrics
                    result={currentEnvelope.result as any}
                    activeWorkspace={activeWorkspace}
                  />
                )}
                {activeModule === 'rc-column-design' && currentEnvelope.result && (
                  <RcColumnMetrics
                    result={currentEnvelope.result as any}
                    activeWorkspace={activeWorkspace}
                  />
                )}
                {activeModule === 'strut-and-tie' && currentEnvelope.result && (
                  <StrutAndTieMetrics
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

                {capacityGauges && capacityGauges.length > 0 && (
                  <DcrGaugeSuite
                    gauges={capacityGauges}
                    moduleKey={activeModule}
                  />
                )}

                {/* 3. Interactive Analytical Engineering Diagram Container (Graphical & Both modes) */}
                {(analyticalViewMode === 'graphical' || analyticalViewMode === 'both') && (
                  <div
                    data-diagram-export="active-module"
                    className="analytical-diagram-container rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] p-4 shadow-xs overflow-hidden"
                  >
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

                    <div data-cad-diagram="true">
                      {activeModule === 'boq-estimator' && currentEnvelope.result && (
                        <BOQCostBreakdownDiagramSvg params={activeWorkspace.boq} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'rate-analysis' && currentEnvelope.result && (
                        <RateAnalysisBreakdownDiagramSvg params={activeWorkspace.rateAnalysis} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'concrete-materials' && currentEnvelope.result && (
                        <ConcreteMaterialsDiagramSvg params={activeWorkspace.concreteMaterials} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'rebar-bbs' && currentEnvelope.result && (
                        <RebarBBSDiagramSvg params={activeWorkspace.rebarBbs} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'masonry-finishes' && currentEnvelope.result && (
                        <MasonryDiagramSvg params={activeWorkspace.masonry} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'earthwork-alignment' && currentEnvelope.result && (
                        <EarthworkDiagramSvg params={activeWorkspace.earthwork} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'beam-analysis' && currentEnvelope.result && (
                        <BeamDiagramSvg params={activeWorkspace.beam} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'bearing-capacity' && currentEnvelope.result && (
                        <BearingDiagramSvg params={activeWorkspace.bearing} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'concrete-mix' && currentEnvelope.result && (
                        <ConcreteMixSvg params={activeWorkspace.concrete} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'open-channel' && currentEnvelope.result && (
                        <ChannelHydraulicsSvg params={activeWorkspace.channel} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'continuous-beam' && currentEnvelope.result && (
                        <ContinuousBeamDiagramSvg params={activeWorkspace.continuousBeam || defaultContinuousBeam} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'frame-truss-2d' && currentEnvelope.result && (
                        <FrameTruss2DDiagramSvg params={activeWorkspace.frameTruss2d || defaultFrameTruss2d} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'section-analyzer' && currentEnvelope.result && (
                        <SectionAnalyzerDiagramSvg params={activeWorkspace.sectionAnalyzer || defaultSectionAnalyzer} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'rc-column-design' && currentEnvelope.result && (
                        <RcColumnDiagramSvg params={activeWorkspace.rcColumn || defaultRcColumn} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'strut-and-tie' && currentEnvelope.result && (
                        <StrutAndTieDiagramSvg params={activeWorkspace.strutAndTie || defaultStrutAndTie} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'pile-capacity' && currentEnvelope.result && (
                        <PileCapacityDiagramSvg params={activeWorkspace.pile || defaultPile} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                      {activeModule === 'pipe-hydraulics' && currentEnvelope.result && (
                        <PipeHydraulicsDiagramSvg params={activeWorkspace.pipe || defaultPipe} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Analytical Dense Table Suite, Domain Schedule Tables & Step-by-Step Derivations */}
                {(analyticalViewMode === 'tabular' || analyticalViewMode === 'both') && (
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
                          onClick={() => setIsTableCompact((prev) => !prev)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Toggle compact table density"
                        >
                          <span>{isTableCompact ? 'Normal Density' : 'Compact Density'}</span>
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
                    onPushResourceCeilingsToInventory={handlePushResourceCeilingsToInventory}
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

                {/* Step-by-Step Hand Calculation Engine & Verification Panel */}
                {(analyticalViewMode === 'steps' ||
                  (analyticalViewMode === 'both' &&
                    Boolean((currentEnvelope as any).handCalculationSteps || (currentEnvelope as any).scopeAndLimits))) && (
                  <StepByStepPanel
                    moduleTitle={MODULE_META[activeModule].label}
                    steps={(currentEnvelope as any).handCalculationSteps}
                    scopeAndLimits={(currentEnvelope as any).scopeAndLimits}
                  />
                )}
              </motion.section>
            </div>

            {/* Always-Rendered Hidden Print Capture Source so Quick Print & PDF capture KPIs, CAD diagram, and schedule table regardless of active analyticalViewMode */}
            <div id="pb-print-capture-source" className="hidden" aria-hidden="true">
              <div className="print-capture-kpi-summary space-y-3">
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
                  <ContinuousBeamMetrics result={currentEnvelope.result as any} />
                )}
                {activeModule === 'frame-truss-2d' && currentEnvelope.result && (
                  <FrameTruss2DMetrics result={currentEnvelope.result as any} />
                )}
                {activeModule === 'section-analyzer' && currentEnvelope.result && (
                  <SectionAnalyzerMetrics result={currentEnvelope.result as any} activeWorkspace={activeWorkspace} />
                )}
                {activeModule === 'rc-column-design' && currentEnvelope.result && (
                  <RcColumnMetrics result={currentEnvelope.result as any} activeWorkspace={activeWorkspace} />
                )}
                {activeModule === 'strut-and-tie' && currentEnvelope.result && (
                  <StrutAndTieMetrics result={currentEnvelope.result as any} />
                )}
                {activeModule === 'pile-capacity' && currentEnvelope.result && (
                  <PileCapacityMetrics result={currentEnvelope.result as any} />
                )}
                {activeModule === 'pipe-hydraulics' && currentEnvelope.result && (
                  <PipeHydraulicsMetrics result={currentEnvelope.result as any} />
                )}
                {capacityGauges && capacityGauges.length > 0 && (
                  <DcrGaugeSuite gauges={capacityGauges} moduleKey={activeModule} />
                )}
              </div>

              <div className="print-capture-diagram" data-cad-diagram="true">
                {activeModule === 'boq-estimator' && currentEnvelope.result && (
                  <BOQCostBreakdownDiagramSvg params={activeWorkspace.boq} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'rate-analysis' && currentEnvelope.result && (
                  <RateAnalysisBreakdownDiagramSvg params={activeWorkspace.rateAnalysis} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'concrete-materials' && currentEnvelope.result && (
                  <ConcreteMaterialsDiagramSvg params={activeWorkspace.concreteMaterials} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'rebar-bbs' && currentEnvelope.result && (
                  <RebarBBSDiagramSvg params={activeWorkspace.rebarBbs} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'masonry-finishes' && currentEnvelope.result && (
                  <MasonryDiagramSvg params={activeWorkspace.masonry} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'earthwork-alignment' && currentEnvelope.result && (
                  <EarthworkDiagramSvg params={activeWorkspace.earthwork} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'beam-analysis' && currentEnvelope.result && (
                  <BeamDiagramSvg params={activeWorkspace.beam} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'bearing-capacity' && currentEnvelope.result && (
                  <BearingDiagramSvg params={activeWorkspace.bearing} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'concrete-mix' && currentEnvelope.result && (
                  <ConcreteMixSvg params={activeWorkspace.concrete} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'open-channel' && currentEnvelope.result && (
                  <ChannelHydraulicsSvg params={activeWorkspace.channel} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'continuous-beam' && currentEnvelope.result && (
                  <ContinuousBeamDiagramSvg params={activeWorkspace.continuousBeam || defaultContinuousBeam} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'frame-truss-2d' && currentEnvelope.result && (
                  <FrameTruss2DDiagramSvg params={activeWorkspace.frameTruss2d || defaultFrameTruss2d} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'section-analyzer' && currentEnvelope.result && (
                  <SectionAnalyzerDiagramSvg params={activeWorkspace.sectionAnalyzer || defaultSectionAnalyzer} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'rc-column-design' && currentEnvelope.result && (
                  <RcColumnDiagramSvg params={activeWorkspace.rcColumn || defaultRcColumn} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'strut-and-tie' && currentEnvelope.result && (
                  <StrutAndTieDiagramSvg params={activeWorkspace.strutAndTie || defaultStrutAndTie} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'pile-capacity' && currentEnvelope.result && (
                  <PileCapacityDiagramSvg params={activeWorkspace.pile || defaultPile} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
                {activeModule === 'pipe-hydraulics' && currentEnvelope.result && (
                  <PipeHydraulicsDiagramSvg params={activeWorkspace.pipe || defaultPipe} result={currentEnvelope.result as any} unitPreset={activeWorkspace.unitPreferences?.systemPreset || 'metric'} />
                )}
              </div>

              <div className="print-capture-table">
                <AnalyticalDenseTable
                  activeModule={activeModule}
                  activeWorkspace={activeWorkspace}
                  currentEnvelope={currentEnvelope}
                  isCompact={true}
                  searchQuery=""
                />
              </div>
            </div>
            </>
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
          isMobileSidebarOpen={mobileDrawerOpen}
          isDesktopSidebarOpen={!appState.sidebarCollapsed}
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

        {/* Governing Mathematical Equations & Code Clauses Modal */}
        {showGoverningEquations && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gov-eq-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                  <div>
                    <h2 id="gov-eq-title" className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                      {MODULE_META[activeModule].label} · Governing Equations
                    </h2>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                      Standard: <span className="text-[var(--md-sys-color-primary)] font-semibold">{governingEqInfo.codeStandard}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGoverningEquations(false)}
                  className="touch-target-48 p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] text-sm cursor-pointer"
                  aria-label="Close governing equations dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar">
                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                  Mathematical formulations, boundary assumptions, and limit-state derivations governing calculation results for this active module.
                </div>

                <div className="space-y-3">
                  {governingEqInfo.equations.map((eq, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                          {eq.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] font-bold">
                          Equation {idx + 1}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] font-mono text-sm font-bold text-[var(--md-sys-color-primary)] tracking-wide overflow-x-auto">
                        {eq.formula}
                      </div>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                        {eq.description}
                      </p>
                      {eq.variables && eq.variables.length > 0 && (
                        <div className="pt-1 border-t border-[var(--md-sys-color-outline-variant)] text-[10px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex flex-wrap gap-x-3 gap-y-0.5">
                          {eq.variables.map((v, vIdx) => (
                            <span key={vIdx}>• {v}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowGoverningEquations(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] cursor-pointer hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
              userProfile={userProfile}
              projectName={activeWorkspace.name}
              projectCode={activeWorkspace.projectCode}
              siteLocation={activeWorkspace.siteLocation}
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
              onPushFootprintToBoq={(footprintItems) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  boq: {
                    ...ws.boq,
                    items: [...ws.boq.items, ...footprintItems],
                  },
                }));
                navigateToModule('boq-estimator');
                setArchitectureModalOpen(false);
                triggerCelebration(
                  'Buildable Footprint & Excavation Pushed to BOQ',
                  `Added ${footprintItems.length} line items (foundation excavation, blinding bed & typical slab allowance) to BOQ Estimator.`,
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
              onSendStaircaseToBoq={(stairItems) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  boq: {
                    ...ws.boq,
                    items: [...ws.boq.items, ...stairItems],
                  },
                }));
                navigateToModule('boq-estimator');
                setArchitectureModalOpen(false);
                triggerCelebration(
                  'Staircase Concrete & Formwork Sent to BOQ',
                  `Added ${stairItems.length} line items (RCC waist slab/steps & soffit/riser shuttering) to BOQ Estimator.`,
                  'success'
                );
              }}
              onSendTankToRebar={(rebarParams) => {
                updateActiveWorkspace((ws) => ({
                  ...ws,
                  activeModule: 'rebar-bbs',
                  rebarBbs: {
                    ...ws.rebarBbs,
                    ...rebarParams,
                  },
                }));
                navigateToModule('rebar-bbs');
                setArchitectureModalOpen(false);
                triggerCelebration(
                  'Tank Slab Sent to Rebar BBS',
                  'Transferred tank slab span, clear cover & bar spacing parameters directly into Rebar Bar Bending Schedule.',
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
          projectName={activeWorkspace.name}
          engineerName={userProfile.fullName || activeWorkspace.engineerOfRecord}
          onNavigateToLab={(testId) => {
            updateActiveWorkspace((ws) => {
              const prevLab = ws.testingLab || createDefaultTestingLabState();
              const test = TESTING_LAB_TEST_MAP[testId];
              return {
                ...ws,
                testingLab: {
                  ...prevLab,
                  activeDomainId: test?.domainId || 'site-checklists',
                  activeTestId: testId,
                },
              };
            });
            setSiteQcModalOpen(false);
            navigateToModule('testing-lab-qaqc');
          }}
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
              onOpenPrintPreview={handleOpenPrintPreview}
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
          onNavigateHome={() => navigateToDashboard('home')}
        />
      </div>
      )}

      {/* Non-destructive URL Deep-Link Confirmation Modal */}
      {pendingDeepLinkOverwrite && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deeplink-confirm-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] shadow-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 id="deeplink-confirm-title" className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  Load Worked Example from URL?
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                  Your current workspace already contains active structural parameters. Loading{' '}
                  <strong className="text-[var(--md-sys-color-on-surface)]">{pendingDeepLinkOverwrite.title}</strong>{' '}
                  will replace those inputs (Undo remains available).
                </p>
                <div className="text-[11px] font-mono text-[var(--md-sys-color-primary)] pt-1">
                  {pendingDeepLinkOverwrite.subtitle}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              <button
                type="button"
                onClick={() => setPendingDeepLinkOverwrite(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
              >
                Keep Current Workspace
              </button>
              <button
                type="button"
                onClick={() => {
                  const fn = pendingDeepLinkOverwrite.onConfirm;
                  setPendingDeepLinkOverwrite(null);
                  fn();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 cursor-pointer"
              >
                Load Example
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Isolated root-level container for pristine vector print / PDF execution (never clipped by screen layout) */}
      <div id="pb-printable-report" className="hidden print:block bg-white text-slate-900 m-0 p-0 font-sans"></div>
    </ErrorBoundary>
  );
}
