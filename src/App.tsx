import React, { useEffect, useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import { Logo, LogoMark } from './components/Logo';
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
  getCurrencySymbol,
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
} from './components/EngineeringDiagrams';
import { CommandPalette } from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UnitInput } from './components/UnitInput';
import { UnitValueDisplay } from './components/UnitValueDisplay';
import { UnitPresetSelector } from './components/UnitPresetSelector';
import { ProfilePreferencesModal } from './components/ProfilePreferencesModal';
import { PresetQuickBar } from './components/PresetQuickBar';
import { PrintPreviewModal } from './components/PrintPreviewModal';
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
  const [toastBanner, setToastBanner] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [profilePreferencesModalOpen, setProfilePreferencesModalOpen] = useState(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'profile' | 'preferences' | 'presets'>('profile');
  const [printPreviewModalOpen, setPrintPreviewModalOpen] = useState(false);

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

  // Global Keyboard Shortcut: Ctrl + K or Cmd + K or "/" opens Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
  }, [effectiveTheme]);

  useEffect(() => {
    if (!toastBanner) return;
    const timer = setTimeout(() => setToastBanner(null), 4500);
    return () => clearTimeout(timer);
  }, [toastBanner]);

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
  ]);

  const updateActiveWorkspace = (updater: (ws: CivilWorkspace) => CivilWorkspace) => {
    setAppState((prev) => ({
      ...prev,
      workspaces: prev.workspaces.map((ws) =>
        ws.id === activeWorkspace.id
          ? { ...updater(ws), updatedAt: new Date().toISOString() }
          : ws
      ),
    }));
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

  const handleSelectUnitPreset = (preset: UnitSystemPreset) => {
    updateActiveWorkspace((ws) => ({
      ...ws,
      unitPreferences: {
        systemPreset: preset,
        fieldUnits: {},
        outputUnits: {},
      },
    }));
    setToastBanner(`Switched project unit system to ${preset.toUpperCase()}`);
  };

  const handleSetModule = (moduleId: EngineeringModuleId) => {
    updateActiveWorkspace((ws) => ({ ...ws, activeModule: moduleId }));
    setMobileDrawerOpen(false);
  };

  const handleThemeChange = (pref: ThemePreference) => {
    setAppState((prev) => ({ ...prev, themePreference: pref }));
  };

  const handleToggleSidebar = () => {
    setAppState((prev) => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
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
      setToastBanner(`Updated line item "${itemDesc.trim()}"`);
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
      setToastBanner(`Added line item #${newItem.itemNo} to takeoff sheet`);
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
    const calculatedRate = rateRes.unitRatePerM3;

    // Check if an existing line matches workType
    const existingIndex = activeWorkspace.boq.items.findIndex((it) =>
      it.description.toLowerCase().includes(rateRes.workType.toLowerCase()) ||
      it.description.toLowerCase().includes('rcc')
    );

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
      setToastBanner(`Updated existing item rate with ${rateRes.currencySymbol} ${calculatedRate.toFixed(2)}/m³`);
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
    } else {
      return;
    }

    setAppState((prev) => ({
      ...prev,
      calculationHistory: [newRecord, ...prev.calculationHistory],
    }));

    setToastBanner(`Logged snapshot #${newId.slice(0, 8)} to ${activeWorkspace.name}`);
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
      />

      {showSplash && <AppSplash onComplete={() => setShowSplash(false)} />}

      <div className="h-screen h-[100dvh] flex flex-col bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)] overflow-hidden">
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
              onClick={() => {
                handleSetModule('boq-estimator');
                const mainEl = document.getElementById('top');
                if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
                Ctrl K
              </kbd>
            </button>

            <nav
              aria-label="Primary Engineering Modules"
              className="flex items-center gap-3 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] overflow-x-auto"
            >
              {(Object.keys(MODULE_META) as EngineeringModuleId[]).map((modId) => {
                const isCurrent = activeModule === modId;
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
              className="hidden sm:inline-flex touch-target-48 px-2.5 md:px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] items-center gap-1.5 cursor-pointer"
              title="Print Preview & Vector PDF Submittal Engine"
            >
              <Printer className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="hidden xl:inline">Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceManagerOpen(true)}
              className="touch-target-48 px-2.5 md:px-3 py-2 text-xs font-semibold rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-1.5 cursor-pointer"
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
              title={`Engineer Profile: ${userProfile.fullName} (${userProfile.designation})`}
            >
              <div className="w-6 h-6 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-xs">
                {userProfile.initials || userProfile.fullName.slice(0, 2).toUpperCase() || 'PB'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight truncate max-w-[130px]">
                  {userProfile.fullName.split(',')[0]}
                </span>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)] leading-tight truncate max-w-[130px]">
                  {userProfile.licenseNumber || userProfile.role.replace('-', ' ')}
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
                    {(Object.keys(MODULE_META) as EngineeringModuleId[]).map((modId) => {
                      const Icon = MODULE_META[modId].icon;
                      const active = activeModule === modId;
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
            className={`hidden lg:flex flex-col h-full border-r border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] transition-all duration-200 shrink-0 select-none overflow-hidden ${
              appState.sidebarCollapsed ? 'w-16' : 'w-72'
            }`}
          >
            {/* Sidebar Top: Logo, Tagline & Collapse/Expand Rail Controls */}
            <div className="shrink-0 p-3 flex flex-col gap-2.5 border-b border-[var(--md-sys-color-outline-variant)]/50">
              <div className="flex items-center justify-between">
                {!appState.sidebarCollapsed ? (
                  <Logo
                    variant="full"
                    size="sm"
                    showTagline={true}
                    onClick={() => {
                      handleSetModule('boq-estimator');
                      const mainEl = document.getElementById('top');
                      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={handleToggleSidebar}
                    title="PB CivilLab — Expand Sidebar"
                    className="mx-auto p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-primary)] cursor-pointer"
                  >
                    <LogoMark size={28} animated={true} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleSidebar}
                  aria-label={appState.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="touch-target-48 px-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] inline-flex items-center gap-1.5 text-xs font-mono cursor-pointer shrink-0"
                >
                  {appState.sidebarCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4 shrink-0" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4 shrink-0" />
                  )}
                </button>
              </div>
              {!appState.sidebarCollapsed && (
                <button
                  type="button"
                  onClick={handleOpenNewWorkspace}
                  className="w-full touch-target-48 px-2.5 py-1.5 rounded-lg bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] inline-flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer border border-[var(--md-sys-color-outline-variant)]"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>New Project Workspace</span>
                </button>
              )}
            </div>

            {/* Sidebar Middle: Scrollable Engineering Modules Directory */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 custom-scrollbar">
              <div>
                {!appState.sidebarCollapsed && (
                  <div className="px-1 mb-2 text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                    Engineering Modules
                  </div>
                )}
                <div className="space-y-1">
                  {(Object.keys(MODULE_META) as EngineeringModuleId[]).map((modId) => {
                    const Icon = MODULE_META[modId].icon;
                    const active = activeModule === modId;
                    return (
                      <button
                        key={modId}
                        type="button"
                        onClick={() => handleSetModule(modId)}
                        title={MODULE_META[modId].label}
                        className={`w-full touch-target-48 px-3 rounded-lg flex items-center gap-3 text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-bold'
                            : 'text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] hover:text-[var(--md-sys-color-on-surface)]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!appState.sidebarCollapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="text-xs truncate">{MODULE_META[modId].label}</div>
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
            <div className="shrink-0 p-3 border-t border-[var(--md-sys-color-outline-variant)] space-y-2 bg-[var(--md-sys-color-surface)]">
              <button
                type="button"
                onClick={() => setWorkspaceManagerOpen(true)}
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                title="Project Workspaces Manager"
              >
                <FolderArchive className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                {!appState.sidebarCollapsed && (
                  <div className="text-left min-w-0">
                    <div className="font-semibold truncate">Projects Manager</div>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {appState.workspaces.length} Projects · {activeWorkspace.currency}
                    </div>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleOpenProfileModal('profile')}
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2.5 text-xs font-medium cursor-pointer"
                title="Engineer Profile, Preferences & Presets"
              >
                <User className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                {!appState.sidebarCollapsed && (
                  <div className="text-left min-w-0 flex-1">
                    <div className="font-semibold truncate">{userProfile.fullName}</div>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {userProfile.designation} · Settings
                    </div>
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInspectorModalOpen(true)}
                className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] flex items-center gap-2.5 text-xs font-medium cursor-pointer"
              >
                <Database className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
                {!appState.sidebarCollapsed && (
                  <div className="text-left min-w-0">
                    <div className="font-semibold truncate">Schema v2 Persistence</div>
                    <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] truncate">
                      {appState.calculationHistory.length} logs · 100% Client-Side
                    </div>
                  </div>
                )}
              </button>

              {!appState.sidebarCollapsed && (
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                  {(['light', 'dark', 'system'] as ThemePreference[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleThemeChange(mode)}
                      className={`touch-target-48 rounded-md text-xs font-semibold capitalize flex items-center justify-center gap-1 cursor-pointer ${
                        appState.themePreference === mode
                          ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs'
                          : 'text-[var(--md-sys-color-on-surface-variant)]'
                      }`}
                    >
                      {mode === 'light' && <Sun className="w-3.5 h-3.5" />}
                      {mode === 'dark' && <Moon className="w-3.5 h-3.5" />}
                      {mode === 'system' && <Monitor className="w-3.5 h-3.5" />}
                      <span>{mode}</span>
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
                  <div className="font-bold text-sm text-black font-sans">{userProfile.fullName}</div>
                  <div className="text-gray-700">{userProfile.designation} · {userProfile.organization}</div>
                  <div className="text-gray-600 text-[11px] mt-0.5">
                    License ID: <strong>{userProfile.licenseNumber || 'IEB PE-41892'}</strong>
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

            {toastBanner && (
              <div className="mx-4 md:mx-6 mt-3 px-4 py-3 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-xs font-mono flex items-center justify-between">
                <span>{toastBanner}</span>
                <button type="button" onClick={() => setToastBanner(null)} className="underline font-bold">Dismiss</button>
              </div>
            )}

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
              {/* Left Pane: Parameter Input Form */}
              <section className="lg:col-span-5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 space-y-4">
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
                  <div className="space-y-4">
                    {/* Project Currency & Markup Modifiers */}
                    <div className="p-3.5 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                          Project BOQ Financial Modifiers
                        </span>
                        <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                          Currency: {getCurrencySymbol(activeWorkspace.boq.currency)} ({activeWorkspace.boq.currency})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Currency</label>
                          <select
                            value={activeWorkspace.boq.currency}
                            onChange={(e) => {
                              const curr = e.target.value as CurrencyCode;
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                currency: curr,
                                boq: { ...ws.boq, currency: curr },
                                rateAnalysis: { ...ws.rateAnalysis, currency: curr },
                              }));
                            }}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          >
                            {SUPPORTED_CURRENCIES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Contingency (%)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="50"
                            value={activeWorkspace.boq.contingencyPercent}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                boq: { ...ws.boq, contingencyPercent: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1">CP & OH (%)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="50"
                            value={activeWorkspace.boq.contractorOverheadPercent}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                boq: { ...ws.boq, contractorOverheadPercent: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1">VAT / Tax (%)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="50"
                            value={activeWorkspace.boq.vatTaxPercent}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                boq: { ...ws.boq, vatTaxPercent: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Add/Edit Takeoff Line Item Form */}
                    <form onSubmit={handleSaveTakeoffItem} className="p-3.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                          {editingTakeoffItemId ? 'Edit Takeoff Line Item' : 'Add Item to Measurement Sheet (L×W×H)'}
                        </span>
                        {editingTakeoffItemId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTakeoffItemId(null);
                              setItemDesc('');
                              setItemNo('');
                            }}
                            className="text-xs text-[var(--md-sys-color-error)] underline cursor-pointer"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Item #</label>
                          <input
                            type="text"
                            placeholder="e.g. 1.01"
                            value={itemNo}
                            onChange={(e) => setItemNo(e.target.value)}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold mb-1">Item Description</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. RCC (1:1.5:3) in Isolated Footings"
                            value={itemDesc}
                            onChange={(e) => setItemDesc(e.target.value)}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Trade Category</label>
                          <select
                            value={itemCategory}
                            onChange={(e) => setItemCategory(e.target.value as TakeoffCategory)}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          >
                            <option value="earthwork">Earthwork</option>
                            <option value="substructure">Substructure</option>
                            <option value="superstructure">Superstructure</option>
                            <option value="rebar">Rebar Steel</option>
                            <option value="masonry">Masonry</option>
                            <option value="finishing">Finishing / Tiles</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="electrical">Electrical</option>
                            <option value="misc">Miscellaneous</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Unit</label>
                          <select
                            value={itemUnit}
                            onChange={(e) => setItemUnit(e.target.value as TakeoffUnit)}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          >
                            <option value="m3">m³ (Cubic Meter)</option>
                            <option value="m2">m² (Square Meter)</option>
                            <option value="m">m (Linear Meter)</option>
                            <option value="cft">CFT (Cubic Feet)</option>
                            <option value="sft">SFT (Square Feet)</option>
                            <option value="rft">RFT (Running Feet)</option>
                            <option value="kg">kg (Kilogram)</option>
                            <option value="ton">Ton (Metric Tonne)</option>
                            <option value="bags">Bags (50kg)</option>
                            <option value="nos">Nos (Items / Count)</option>
                            <option value="lump-sum">Lump-Sum</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Nos / Count</label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={itemMembers}
                            onChange={(e) => setItemMembers(Number(e.target.value))}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* L x W x H with Flexible Universal Unit Engine */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <UnitInput
                          label="Length L"
                          category="length"
                          siValue={itemLength}
                          onChangeSI={(val) => setItemLength(val)}
                          currentUnitId={getFieldUnit('boq.itemL', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('boq.itemL', u)}
                          customUnits={appState.customUnits}
                          step={0.01}
                        />
                        <UnitInput
                          label="Width W"
                          category="length"
                          siValue={itemWidth}
                          onChangeSI={(val) => setItemWidth(val)}
                          currentUnitId={getFieldUnit('boq.itemW', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('boq.itemW', u)}
                          customUnits={appState.customUnits}
                          step={0.01}
                        />
                        <UnitInput
                          label="Height H"
                          category="length"
                          siValue={itemHeight}
                          onChangeSI={(val) => setItemHeight(val)}
                          currentUnitId={getFieldUnit('boq.itemH', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('boq.itemH', u)}
                          customUnits={appState.customUnits}
                          step={0.01}
                        />
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Deduction</label>
                          <input
                            type="number"
                            step="0.01"
                            value={itemDeduction}
                            onChange={(e) => setItemDeduction(Number(e.target.value))}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Wastage (%)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={itemWastage}
                            onChange={(e) => setItemWastage(Number(e.target.value))}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold">Unit Rate ({getCurrencySymbol(activeWorkspace.boq.currency)})</label>
                            {rateAnalysisEnvelope.result && (
                              <button
                                type="button"
                                onClick={() => setItemUnitRate(rateAnalysisEnvelope.result!.unitRatePerM3)}
                                className="text-[10px] text-[var(--md-sys-color-primary)] font-bold underline cursor-pointer"
                                title="Import calculated rate from Rate Analysis Workbench"
                              >
                                Use Rate ({rateAnalysisEnvelope.result.unitRatePerM3.toFixed(0)})
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            step="0.1"
                            value={itemUnitRate}
                            onChange={(e) => setItemUnitRate(Number(e.target.value))}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full touch-target-48 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{editingTakeoffItemId ? 'Save Changes' : 'Append to Takeoff Spreadsheet'}</span>
                      </button>
                    </form>

                    {/* Quick Helper Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleApplyRateToBOQ}
                          className="text-xs font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1.5 hover:underline cursor-pointer"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          <span>Apply Rate Analysis to BOQ</span>
                        </button>

                        {activeWorkspace.boq.items.length > 0 ? (
                          <button
                            type="button"
                            onClick={handleClearAllBOQItems}
                            className="text-xs font-semibold text-[var(--md-sys-color-error)] flex items-center gap-1 hover:underline cursor-pointer"
                            title="Clear all takeoff line items in this workspace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear All Items</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleLoadSampleBOQItems}
                            className="text-xs font-semibold text-[var(--md-sys-color-primary)] flex items-center gap-1 hover:underline cursor-pointer"
                            title="Load 7 demo takeoff items"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Load Demo Takeoffs</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleExportBOQCSV}
                        className="text-xs font-semibold text-[var(--md-sys-color-on-surface)] flex items-center gap-1.5 hover:underline cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
                        <span>Export CSV Sheet</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* MODULE: GRANULAR UNIT RATE ANALYSIS */}
                {activeModule === 'rate-analysis' && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                          Engineering Trade Work Type
                        </label>
                        <span className="text-xs font-mono font-bold text-[var(--md-sys-color-on-surface)]">
                          {getCurrencySymbol(activeWorkspace.rateAnalysis.currency)} ({activeWorkspace.rateAnalysis.currency})
                        </span>
                      </div>

                      <select
                        value={activeWorkspace.rateAnalysis.workType}
                        onChange={(e) => {
                          const wt = e.target.value as RateAnalysisWorkType;
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            rateAnalysis: { ...ws.rateAnalysis, workType: wt },
                          }));
                        }}
                        className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono font-bold"
                      >
                        <option value="rcc-1-1.5-3">RCC Structural Concrete (1:1.5:3, ~M20)</option>
                        <option value="rcc-1-2-4">RCC Structural Concrete (1:2:4, ~M15)</option>
                        <option value="pcc-1-3-6">PCC Foundation Bed Lean Concrete (1:3:6)</option>
                        <option value="brickwork-1-6">First Class Brickwork in 1:6 Mortar</option>
                        <option value="plaster-1-4">12mm Wall Plaster in 1:4 Mortar</option>
                        <option value="rebar-fabrication">Rebar Cutting, Bending & Placing (1 Ton)</option>
                      </select>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <UnitInput
                            label="Basis Volume"
                            category="volume"
                            siValue={activeWorkspace.rateAnalysis.basisVolumeM3}
                            onChangeSI={(val) => {
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, basisVolumeM3: val },
                              }));
                            }}
                            currentUnitId={getFieldUnit('rate.vol', 'volume', 'm3')}
                            onUnitChange={(u) => updateFieldUnit('rate.vol', u)}
                            customUnits={appState.customUnits}
                            step={0.5}
                            min={0.1}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Currency Code</label>
                          <select
                            value={activeWorkspace.rateAnalysis.currency}
                            onChange={(e) => {
                              const curr = e.target.value as CurrencyCode;
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                currency: curr,
                                boq: { ...ws.boq, currency: curr },
                                rateAnalysis: { ...ws.rateAnalysis, currency: curr },
                              }));
                            }}
                            className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                          >
                            {SUPPORTED_CURRENCIES.map((c) => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Material Market Rates */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                        Material Market Procurement Rates
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Cement ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/50kg bag)</label>
                          <input
                            type="number"
                            step="10"
                            value={activeWorkspace.rateAnalysis.cementPricePerBag}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, cementPricePerBag: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Coarse Sand ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
                          <input
                            type="number"
                            step="50"
                            value={activeWorkspace.rateAnalysis.sandPricePerM3}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, sandPricePerM3: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Stone Chips ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
                          <input
                            type="number"
                            step="50"
                            value={activeWorkspace.rateAnalysis.stoneChipsPricePerM3}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, stoneChipsPricePerM3: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Rebar Steel ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/kg)</label>
                          <input
                            type="number"
                            step="2"
                            value={activeWorkspace.rateAnalysis.rebarPricePerKg}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, rebarPricePerKg: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                      </div>

                      {activeWorkspace.rateAnalysis.workType.startsWith('rcc') && (
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Rebar Allowance (kg/m³ concrete)</label>
                          <input
                            type="number"
                            step="10"
                            value={activeWorkspace.rateAnalysis.rebarAllowanceKgPerM3}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, rebarAllowanceKgPerM3: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>

                    {/* Labor Daily Wages & Man-days */}
                    <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                        Daily Labor Wages & Man-days
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Head Mason ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/day)</label>
                          <input
                            type="number"
                            step="50"
                            value={activeWorkspace.rateAnalysis.masonDailyWage}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, masonDailyWage: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Mason Days Required</label>
                          <input
                            type="number"
                            step="0.05"
                            value={activeWorkspace.rateAnalysis.masonDaysRequired}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, masonDaysRequired: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Helper / Jogali ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/day)</label>
                          <input
                            type="number"
                            step="50"
                            value={activeWorkspace.rateAnalysis.laborerDailyWage}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, laborerDailyWage: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Helper Days Required</label>
                          <input
                            type="number"
                            step="0.1"
                            value={activeWorkspace.rateAnalysis.laborerDaysRequired}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, laborerDaysRequired: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Plant Hire & Margins */}
                    <div className="space-y-2 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                      <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                        Plant Hire & Contractor Margin
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Mixer Hire ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
                          <input
                            type="number"
                            step="25"
                            value={activeWorkspace.rateAnalysis.mixerHirePerM3}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, mixerHirePerM3: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Shuttering Hire ({getCurrencySymbol(activeWorkspace.rateAnalysis.currency)}/m³)</label>
                          <input
                            type="number"
                            step="50"
                            value={activeWorkspace.rateAnalysis.shutteringScaffoldingPerM3}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, shutteringScaffoldingPerM3: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Water & Elect (%)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={activeWorkspace.rateAnalysis.waterElectricityPercent}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, waterElectricityPercent: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold mb-1">Contractor Profit (%)</label>
                          <input
                            type="number"
                            step="1.0"
                            value={activeWorkspace.rateAnalysis.contractorProfitPercent}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rateAnalysis: { ...ws.rateAnalysis, contractorProfitPercent: val },
                              }));
                            }}
                            className="w-full touch-target-48 px-2.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyRateToBOQ}
                      className="w-full touch-target-48 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Apply Unit Rate to BOQ Measurement Sheet</span>
                    </button>
                  </div>
                )}

                {/* MODULE 0: UNIVERSAL UNIT CONVERTER & FEET-INCH PARSER */}
                {activeModule === 'unit-converter' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold">Measurement Discipline Category</label>
                        <button
                          type="button"
                          onClick={() => setCustomUnitModalOpen(true)}
                          className="text-xs font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1 cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Custom Units ({appState.customUnits.length})</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                        {(
                          [
                            { id: 'length', label: 'Length' },
                            { id: 'area', label: 'Area / Land' },
                            { id: 'volume', label: 'Volume / CFT' },
                            { id: 'pressure', label: 'Stress / MPa' },
                            { id: 'mass', label: 'Mass / Bags' },
                            { id: 'force', label: 'Force / kN' },
                            { id: 'slope', label: 'Slope / %' },
                          ] as { id: UnitCategoryKey; label: string }[]
                        ).map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              const units = STANDARD_UNITS[cat.id];
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                converter: {
                                  ...ws.converter,
                                  category: cat.id,
                                  fromUnit: units[0].id,
                                  toUnit: units[1] ? units[1].id : units[0].id,
                                },
                              }));
                            }}
                            className={`touch-target-48 px-2 rounded text-xs font-semibold cursor-pointer ${
                              activeWorkspace.converter.category === cat.id
                                ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs font-bold'
                                : 'text-[var(--md-sys-color-on-surface-variant)]'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Source Unit (From)</label>
                        <select
                          value={activeWorkspace.converter.fromUnit}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              converter: { ...ws.converter, fromUnit: val },
                            }));
                          }}
                          className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
                        >
                          {availableCategoryUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Target Unit (To)</label>
                        <select
                          value={activeWorkspace.converter.toUnit}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              converter: { ...ws.converter, toUnit: val },
                            }));
                          }}
                          className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
                        >
                          {availableCategoryUnits.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.symbol}) {u.isRegional ? '★ Regional' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold">Input Numeric Value</label>
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              converter: {
                                ...ws.converter,
                                fromUnit: ws.converter.toUnit,
                                toUnit: ws.converter.fromUnit,
                              },
                            }));
                          }}
                          className="text-xs font-bold text-[var(--md-sys-color-primary)] flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Swap Units</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={activeWorkspace.converter.inputValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            converter: { ...ws.converter, inputValue: val },
                          }));
                        }}
                        className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-base"
                      />
                    </div>

                    {/* Architectural Feet-Inch String Parser Card */}
                    <div className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                          Architectural Feet-Inch Parser
                        </label>
                        <span className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          e.g. 12&apos;-4 1/2&quot;
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 14'-6 3/4&quot; or 25.5'"
                        value={activeWorkspace.converter.feetInchRawString}
                        onChange={(e) => {
                          const str = e.target.value;
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            converter: { ...ws.converter, feetInchRawString: str },
                          }));
                        }}
                        className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
                      />
                      {activeFeetInchResult.isValid && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                          <div>
                            <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Decimal Feet</span>
                            <strong>{activeFeetInchResult.totalFeet.toFixed(3)} ft</strong>
                          </div>
                          <div>
                            <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Decimal Inches</span>
                            <strong>{activeFeetInchResult.totalInches.toFixed(2)} in</strong>
                          </div>
                          <div>
                            <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Metric (m)</span>
                            <strong>{activeFeetInchResult.totalMeters.toFixed(3)} m</strong>
                          </div>
                          <div>
                            <span className="text-[var(--md-sys-color-on-surface-variant)] block text-[10px]">Millimeters</span>
                            <strong>{activeFeetInchResult.totalMm.toFixed(1)} mm</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODULE 1: CONCRETE MATERIAL & MIX TECH */}
                {activeModule === 'concrete-materials' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Building Code</label>
                        <select
                          value={activeWorkspace.concreteMaterials.code}
                          onChange={(e) => {
                            const val = e.target.value as BuildingCode;
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              governingCode: val,
                              concreteMaterials: { ...ws.concreteMaterials, code: val },
                            }));
                          }}
                          className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm bg-[var(--md-sys-color-surface)]"
                        >
                          <option value="BNBC-2020">BNBC-2020</option>
                          <option value="ACI-318">ACI-318</option>
                          <option value="IS-456">IS-456</option>
                        </select>
                      </div>
                      <div>
                        <UnitInput
                          label="Wet Concrete Volume"
                          category="volume"
                          siValue={activeWorkspace.concreteMaterials.wetVolumeM3}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              concreteMaterials: { ...ws.concreteMaterials, wetVolumeM3: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('mat.wetVolume', 'volume', 'm3')}
                          onUnitChange={(u) => updateFieldUnit('mat.wetVolume', u)}
                          customUnits={appState.customUnits}
                          step={0.5}
                          min={0.1}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Volumetric Mix Ratio (Cement : Sand : Agg)</label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          step="0.25"
                          value={activeWorkspace.concreteMaterials.ratioCement}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              concreteMaterials: { ...ws.concreteMaterials, ratioCement: val },
                            }));
                          }}
                          className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm"
                        />
                        <input
                          type="number"
                          step="0.25"
                          value={activeWorkspace.concreteMaterials.ratioSand}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              concreteMaterials: { ...ws.concreteMaterials, ratioSand: val },
                            }));
                          }}
                          className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm"
                        />
                        <input
                          type="number"
                          step="0.25"
                          value={activeWorkspace.concreteMaterials.ratioAggregate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              concreteMaterials: { ...ws.concreteMaterials, ratioAggregate: val },
                            }));
                          }}
                          className="w-full touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MODULE 2: STRUCTURAL REBAR BBS */}
                {activeModule === 'rebar-bbs' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">RCC Element Type</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                        {(['slab', 'column', 'footing'] as StructuralElementType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                rebarBbs: { ...ws.rebarBbs, elementType: type },
                              }))
                            }
                            className={`touch-target-48 px-2 rounded-md text-xs font-semibold capitalize ${
                              activeWorkspace.rebarBbs.elementType === type
                                ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-xs font-bold'
                                : 'text-[var(--md-sys-color-on-surface-variant)]'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeWorkspace.rebarBbs.elementType === 'slab' && (
                      <div className="grid grid-cols-2 gap-3">
                        <UnitInput
                          label="Slab Length"
                          category="length"
                          siValue={activeWorkspace.rebarBbs.slabLengthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              rebarBbs: { ...ws.rebarBbs, slabLengthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('rebar.slabLength', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('rebar.slabLength', u)}
                          customUnits={appState.customUnits}
                          step={0.25}
                        />
                        <UnitInput
                          label="Main Bar Dia"
                          category="length"
                          siValue={activeWorkspace.rebarBbs.mainBarDiaMm * 0.001}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              rebarBbs: { ...ws.rebarBbs, mainBarDiaMm: val * 1000 },
                            }));
                          }}
                          currentUnitId={getFieldUnit('rebar.mainDia', 'length', 'mm')}
                          onUnitChange={(u) => updateFieldUnit('rebar.mainDia', u)}
                          customUnits={appState.customUnits}
                          step={2}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* MODULE 3: MASONRY & FINISHES */}
                {activeModule === 'masonry-finishes' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <UnitInput
                        label="Wall Length"
                        category="length"
                        siValue={activeWorkspace.masonry.wallLengthM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            masonry: { ...ws.masonry, wallLengthM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('mas.wallL', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('mas.wallL', u)}
                        customUnits={appState.customUnits}
                        step={0.5}
                      />
                      <UnitInput
                        label="Wall Height"
                        category="length"
                        siValue={activeWorkspace.masonry.wallHeightM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            masonry: { ...ws.masonry, wallHeightM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('mas.wallH', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('mas.wallH', u)}
                        customUnits={appState.customUnits}
                        step={0.2}
                      />
                      <UnitInput
                        label="Thickness"
                        category="length"
                        siValue={activeWorkspace.masonry.wallThicknessM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            masonry: { ...ws.masonry, wallThicknessM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('mas.wallT', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('mas.wallT', u)}
                        customUnits={appState.customUnits}
                        step={0.125}
                      />
                    </div>
                  </div>
                )}

                {/* MODULE 4: EARTHWORK & ALIGNMENT */}
                {activeModule === 'earthwork-alignment' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Calculation Type</label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                        {(
                          [
                            { id: 'pit-excavation', label: 'Sloped Pit' },
                            { id: 'trapezoidal-trench', label: 'Trench' },
                            { id: 'prismoidal-road', label: 'Road Align' },
                          ] as const
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              updateActiveWorkspace((ws) => ({
                                ...ws,
                                earthwork: { ...ws.earthwork, calculationType: t.id },
                              }))
                            }
                            className={`touch-target-48 px-1 rounded-md text-xs font-semibold ${
                              activeWorkspace.earthwork.calculationType === t.id
                                ? 'bg-[var(--md-sys-color-surface)] font-bold'
                                : 'text-[var(--md-sys-color-on-surface-variant)]'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {activeWorkspace.earthwork.calculationType === 'pit-excavation' && (
                      <div className="grid grid-cols-3 gap-2">
                        <UnitInput
                          label="Pit Top Length"
                          category="length"
                          siValue={activeWorkspace.earthwork.pitTopLengthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, pitTopLengthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.pitL', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.pitL', u)}
                          customUnits={appState.customUnits}
                          step={0.5}
                        />
                        <UnitInput
                          label="Pit Top Width"
                          category="length"
                          siValue={activeWorkspace.earthwork.pitTopWidthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, pitTopWidthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.pitW', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.pitW', u)}
                          customUnits={appState.customUnits}
                          step={0.5}
                        />
                        <UnitInput
                          label="Excavation Depth"
                          category="length"
                          siValue={activeWorkspace.earthwork.pitDepthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, pitDepthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.pitD', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.pitD', u)}
                          customUnits={appState.customUnits}
                          step={0.2}
                        />
                      </div>
                    )}

                    {activeWorkspace.earthwork.calculationType === 'trapezoidal-trench' && (
                      <div className="grid grid-cols-3 gap-2">
                        <UnitInput
                          label="Trench Length"
                          category="length"
                          siValue={activeWorkspace.earthwork.trenchLengthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, trenchLengthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.trenchL', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.trenchL', u)}
                          customUnits={appState.customUnits}
                          step={1}
                        />
                        <UnitInput
                          label="Bottom Width"
                          category="length"
                          siValue={activeWorkspace.earthwork.trenchBottomWidthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, trenchBottomWidthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.trenchW', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.trenchW', u)}
                          customUnits={appState.customUnits}
                          step={0.25}
                        />
                        <UnitInput
                          label="Trench Depth"
                          category="length"
                          siValue={activeWorkspace.earthwork.trenchDepthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, trenchDepthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.trenchD', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.trenchD', u)}
                          customUnits={appState.customUnits}
                          step={0.2}
                        />
                      </div>
                    )}

                    {activeWorkspace.earthwork.calculationType === 'prismoidal-road' && (
                      <div className="grid grid-cols-2 gap-2">
                        <UnitInput
                          label="Road Align Length"
                          category="length"
                          siValue={activeWorkspace.earthwork.roadLengthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, roadLengthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.roadL', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.roadL', u)}
                          customUnits={appState.customUnits}
                          step={5}
                        />
                        <UnitInput
                          label="Formation Width"
                          category="length"
                          siValue={activeWorkspace.earthwork.formationWidthM}
                          onChangeSI={(val) => {
                            updateActiveWorkspace((ws) => ({
                              ...ws,
                              earthwork: { ...ws.earthwork, formationWidthM: val },
                            }));
                          }}
                          currentUnitId={getFieldUnit('earth.roadW', 'length', 'm')}
                          onUnitChange={(u) => updateFieldUnit('earth.roadW', u)}
                          customUnits={appState.customUnits}
                          step={0.5}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* MODULE 5: BEAM ANALYSIS */}
                {activeModule === 'beam-analysis' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <UnitInput
                        label="Span Length L"
                        category="length"
                        siValue={activeWorkspace.beam.spanLengthM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            beam: { ...ws.beam, spanLengthM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('beam.spanLength', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('beam.spanLength', u)}
                        customUnits={appState.customUnits}
                        step={0.5}
                      />
                      <UnitInput
                        label="Uniform Load w"
                        category="distributed_load"
                        siValue={activeWorkspace.beam.uniformLoadKnPerM * 1000}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            beam: { ...ws.beam, uniformLoadKnPerM: val / 1000 },
                          }));
                        }}
                        currentUnitId={getFieldUnit('beam.udl', 'distributed_load', 'kN/m')}
                        onUnitChange={(u) => updateFieldUnit('beam.udl', u)}
                        customUnits={appState.customUnits}
                        step={1}
                      />
                    </div>
                  </div>
                )}

                {/* MODULE 6: BEARING CAPACITY */}
                {activeModule === 'bearing-capacity' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <UnitInput
                        label="Footing Width B"
                        category="length"
                        siValue={activeWorkspace.bearing.footingWidthM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            bearing: { ...ws.bearing, footingWidthM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('bearing.B', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('bearing.B', u)}
                        customUnits={appState.customUnits}
                        step={0.2}
                      />
                      <UnitInput
                        label="Embedment Depth Df"
                        category="length"
                        siValue={activeWorkspace.bearing.embedmentDepthM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            bearing: { ...ws.bearing, embedmentDepthM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('bearing.Df', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('bearing.Df', u)}
                        customUnits={appState.customUnits}
                        step={0.2}
                      />
                    </div>
                  </div>
                )}

                {/* MODULE 7: CONCRETE MIX DESIGN */}
                {activeModule === 'concrete-mix' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <UnitInput
                        label="Target f'c"
                        category="pressure"
                        siValue={activeWorkspace.concrete.targetStrengthMpa * 1000000}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            concrete: { ...ws.concrete, targetStrengthMpa: val / 1000000 },
                          }));
                        }}
                        currentUnitId={getFieldUnit('mix.fc', 'pressure', 'MPa')}
                        onUnitChange={(u) => updateFieldUnit('mix.fc', u)}
                        customUnits={appState.customUnits}
                        step={5}
                      />
                      <UnitInput
                        label="Slump"
                        category="length"
                        siValue={activeWorkspace.concrete.slumpMm * 0.001}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            concrete: { ...ws.concrete, slumpMm: val * 1000 },
                          }));
                        }}
                        currentUnitId={getFieldUnit('mix.slump', 'length', 'mm')}
                        onUnitChange={(u) => updateFieldUnit('mix.slump', u)}
                        customUnits={appState.customUnits}
                        step={25}
                      />
                    </div>
                  </div>
                )}

                {/* MODULE 8: OPEN CHANNEL */}
                {activeModule === 'open-channel' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <UnitInput
                        label="Bottom Width b"
                        category="length"
                        siValue={activeWorkspace.channel.bottomWidthM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            channel: { ...ws.channel, bottomWidthM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('hyd.b', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('hyd.b', u)}
                        customUnits={appState.customUnits}
                        step={0.2}
                      />
                      <UnitInput
                        label="Flow Depth y"
                        category="length"
                        siValue={activeWorkspace.channel.flowDepthM}
                        onChangeSI={(val) => {
                          updateActiveWorkspace((ws) => ({
                            ...ws,
                            channel: { ...ws.channel, flowDepthM: val },
                          }));
                        }}
                        currentUnitId={getFieldUnit('hyd.y', 'length', 'm')}
                        onUnitChange={(u) => updateFieldUnit('hyd.y', u)}
                        customUnits={appState.customUnits}
                        step={0.1}
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* Right Pane: Analytical Stage + Detailed Grids */}
              <section className="lg:col-span-7 space-y-6">
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                    <div className="flex items-center gap-2.5">
                      <LogoMark size={24} className="text-[var(--md-sys-color-primary)]" />
                      <div>
                        <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] leading-tight">
                          Analytical Vector Envelope
                        </h2>
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                          CALCULATE SMARTER. BUILD BETTER.
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 no-print">
                      <button
                        type="button"
                        onClick={() => setPrintPreviewModalOpen(true)}
                        className="touch-target-48 px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--md-sys-color-on-surface)] cursor-pointer transition-colors"
                        title="Print Preview & Vector PDF Submittal Engine"
                      >
                        <Printer className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                        <span>Print / Export PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)] rounded-lg p-2">
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
                  </div>

                  {/* Quantitative Metrics Readout for Unit Converter */}
                  {activeModule === 'unit-converter' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <div>
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Source Value</div>
                        <div className="text-xl font-bold font-mono mt-0.5">{activeWorkspace.converter.inputValue} {activeWorkspace.converter.fromUnit}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Converted Value</div>
                        <div className="text-xl font-bold font-mono mt-0.5 text-[var(--md-sys-color-primary)]">
                          {Number(activeConversionResult.result.toFixed(4))} <span className="text-xs font-normal">{activeWorkspace.converter.toUnit}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Conversion Formula</div>
                        <div className="text-xs font-mono mt-1 opacity-90 truncate">{activeConversionResult.formula}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)]">Base SI Unit</div>
                        <div className="text-xs font-mono font-bold mt-1">{BASE_UNITS[activeWorkspace.converter.category]}</div>
                      </div>
                    </div>
                  )}

                  {/* UNIVERSAL QUANTITATIVE METRICS READOUT WITH ON-THE-FLY UNIT SELECTION */}
                  {activeModule === 'concrete-materials' && matEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <UnitValueDisplay
                        label="Total Dry Volume"
                        category="volume"
                        siValue={matEnvelope.result.totalDryVolumeWithWastageM3}
                        currentUnitId={getOutputUnit('mat.out.vol', 'volume', 'm3')}
                        onUnitChange={(u) => updateOutputUnit('mat.out.vol', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Cement Required"
                        category="mass"
                        siValue={matEnvelope.result.cementMassKg}
                        currentUnitId={getOutputUnit('mat.out.cement', 'mass', 'bag50')}
                        onUnitChange={(u) => updateOutputUnit('mat.out.cement', u)}
                        customUnits={appState.customUnits}
                        highlight={true}
                      />
                      <UnitValueDisplay
                        label="Fine Sand Volume"
                        category="volume"
                        siValue={matEnvelope.result.sandVolumeM3}
                        currentUnitId={getOutputUnit('mat.out.sand', 'volume', 'cft')}
                        onUnitChange={(u) => updateOutputUnit('mat.out.sand', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Coarse Agg Volume"
                        category="volume"
                        siValue={matEnvelope.result.aggregateVolumeM3}
                        currentUnitId={getOutputUnit('mat.out.agg', 'volume', 'cft')}
                        onUnitChange={(u) => updateOutputUnit('mat.out.agg', u)}
                        customUnits={appState.customUnits}
                      />
                    </div>
                  )}

                  {activeModule === 'beam-analysis' && beamEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <UnitValueDisplay
                        label="Max Moment (Mmax)"
                        category="moment"
                        siValue={beamEnvelope.result.maxMomentKnm * 1000}
                        currentUnitId={getOutputUnit('beam.out.moment', 'moment', 'kN.m')}
                        onUnitChange={(u) => updateOutputUnit('beam.out.moment', u)}
                        customUnits={appState.customUnits}
                        highlight={true}
                      />
                      <UnitValueDisplay
                        label="Max Shear (Vmax)"
                        category="force"
                        siValue={beamEnvelope.result.maxShearKn * 1000}
                        currentUnitId={getOutputUnit('beam.out.shear', 'force', 'kN')}
                        onUnitChange={(u) => updateOutputUnit('beam.out.shear', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Max Deflection"
                        category="length"
                        siValue={beamEnvelope.result.maxDeflectionMm * 0.001}
                        currentUnitId={getOutputUnit('beam.out.defl', 'length', 'mm')}
                        onUnitChange={(u) => updateOutputUnit('beam.out.defl', u)}
                        customUnits={appState.customUnits}
                        subText={`Allowable limit: ${beamEnvelope.result.allowableDeflectionMm.toFixed(2)} mm`}
                      />
                      <UnitValueDisplay
                        label="Max Flexural Stress"
                        category="pressure"
                        siValue={beamEnvelope.result.bendingStressMpa * 1000000}
                        currentUnitId={getOutputUnit('beam.out.stress', 'pressure', 'MPa')}
                        onUnitChange={(u) => updateOutputUnit('beam.out.stress', u)}
                        customUnits={appState.customUnits}
                        subText={`Allowable: ${activeWorkspace.beam.allowableStressMpa} MPa`}
                      />
                    </div>
                  )}

                  {activeModule === 'bearing-capacity' && bearingEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <UnitValueDisplay
                        label="Allowable Pressure (qall)"
                        category="pressure"
                        siValue={bearingEnvelope.result.allowableBearingKpa * 1000}
                        currentUnitId={getOutputUnit('bearing.out.qall', 'pressure', 'kPa')}
                        onUnitChange={(u) => updateOutputUnit('bearing.out.qall', u)}
                        customUnits={appState.customUnits}
                        highlight={true}
                      />
                      <UnitValueDisplay
                        label="Ultimate Bearing (qult)"
                        category="pressure"
                        siValue={bearingEnvelope.result.ultimateBearingKpa * 1000}
                        currentUnitId={getOutputUnit('bearing.out.qult', 'pressure', 'kPa')}
                        onUnitChange={(u) => updateOutputUnit('bearing.out.qult', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Applied Pressure (qapp)"
                        category="pressure"
                        siValue={bearingEnvelope.result.appliedPressureKpa * 1000}
                        currentUnitId={getOutputUnit('bearing.out.qapp', 'pressure', 'kPa')}
                        onUnitChange={(u) => updateOutputUnit('bearing.out.qapp', u)}
                        customUnits={appState.customUnits}
                      />
                      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Safety Factor</div>
                        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
                          FS = {bearingEnvelope.result.effectiveSafetyFactor.toFixed(2)}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                          Footing Area: {bearingEnvelope.result.footingAreaM2.toFixed(2)} m²
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModule === 'rebar-bbs' && bbsEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <UnitValueDisplay
                        label="Total Steel Weight"
                        category="mass"
                        siValue={bbsEnvelope.result.totalSteelWeightKg}
                        currentUnitId={getOutputUnit('rebar.out.mass', 'mass', 'kg')}
                        onUnitChange={(u) => updateOutputUnit('rebar.out.mass', u)}
                        customUnits={appState.customUnits}
                        highlight={true}
                      />
                      <UnitValueDisplay
                        label="Total Bar Length"
                        category="length"
                        siValue={bbsEnvelope.result.totalBarsLengthM}
                        currentUnitId={getOutputUnit('rebar.out.len', 'length', 'm')}
                        onUnitChange={(u) => updateOutputUnit('rebar.out.len', u)}
                        customUnits={appState.customUnits}
                      />
                      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Total Steel Tonnes</div>
                        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
                          {bbsEnvelope.result.totalSteelTonnes.toFixed(3)} <span className="text-xs font-normal">MT</span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                          Density: {bbsEnvelope.result.steelDensityKgPerM3} kg/m³
                        </div>
                      </div>
                      <UnitValueDisplay
                        label="Total Bend Deductions"
                        category="length"
                        siValue={bbsEnvelope.result.items.reduce((s, it) => s + (it.bendDeductionM || 0), 0)}
                        currentUnitId={getOutputUnit('rebar.out.bend', 'length', 'm')}
                        onUnitChange={(u) => updateOutputUnit('rebar.out.bend', u)}
                        customUnits={appState.customUnits}
                        subText={`Hook: ${activeWorkspace.rebarBbs.hookAngle}° standard`}
                      />
                    </div>
                  )}

                  {activeModule === 'masonry-finishes' && masonryEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-primary-container)]/30 border-[var(--md-sys-color-primary)]">
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Modular Bricks</div>
                        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-primary)] mt-0.5">
                          {masonryEnvelope.result.bricksWithWastageCount.toLocaleString()} <span className="text-xs font-normal">nos</span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                          Net Wall Area: {masonryEnvelope.result.netWallAreaM2.toFixed(2)} m²
                        </div>
                      </div>
                      <UnitValueDisplay
                        label="Dry Wall Mortar"
                        category="volume"
                        siValue={masonryEnvelope.result.mortarVolumeDryM3}
                        currentUnitId={getOutputUnit('mas.out.mortar', 'volume', 'm3')}
                        onUnitChange={(u) => updateOutputUnit('mas.out.mortar', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Plaster Dry Mortar"
                        category="volume"
                        siValue={masonryEnvelope.result.plasterDryVolM3}
                        currentUnitId={getOutputUnit('mas.out.plaster', 'volume', 'm3')}
                        onUnitChange={(u) => updateOutputUnit('mas.out.plaster', u)}
                        customUnits={appState.customUnits}
                      />
                      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Floor Tiles Required</div>
                        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
                          {masonryEnvelope.result.tileBoxesCount} <span className="text-xs font-normal">boxes</span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                          {masonryEnvelope.result.tilesWithWastageCount} tiles ({activeWorkspace.masonry.tilesPerBox}/box)
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModule === 'earthwork-alignment' && earthworkEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <UnitValueDisplay
                        label="In-Situ Cut/Fill Volume"
                        category="volume"
                        siValue={earthworkEnvelope.result.bankVolumeM3}
                        currentUnitId={getOutputUnit('earth.out.insitu', 'volume', 'm3')}
                        onUnitChange={(u) => updateOutputUnit('earth.out.insitu', u)}
                        customUnits={appState.customUnits}
                        highlight={true}
                      />
                      <UnitValueDisplay
                        label="Bulked Haul Volume"
                        category="volume"
                        siValue={earthworkEnvelope.result.looseVolumeM3}
                        currentUnitId={getOutputUnit('earth.out.swelled', 'volume', 'm3')}
                        onUnitChange={(u) => updateOutputUnit('earth.out.swelled', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Compacted Embankment"
                        category="volume"
                        siValue={earthworkEnvelope.result.compactedVolumeM3}
                        currentUnitId={getOutputUnit('earth.out.compacted', 'volume', 'm3')}
                        onUnitChange={(u) => updateOutputUnit('earth.out.compacted', u)}
                        customUnits={appState.customUnits}
                      />
                      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Dump Truck Trips</div>
                        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
                          {earthworkEnvelope.result.haulTruckTripsCount10M3} <span className="text-xs font-normal">loads</span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1">
                          Basis: 10 m³ tipper truck
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModule === 'concrete-mix' && concreteEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <UnitValueDisplay
                        label="Mixing Water Demand"
                        category="mass"
                        siValue={concreteEnvelope.result.batchWaterKg}
                        currentUnitId={getOutputUnit('mix.out.water', 'mass', 'kg')}
                        onUnitChange={(u) => updateOutputUnit('mix.out.water', u)}
                        customUnits={appState.customUnits}
                        subText={`W/C ratio = ${activeWorkspace.concrete.waterCementRatio.toFixed(2)}`}
                      />
                      <UnitValueDisplay
                        label="Cement Content"
                        category="mass"
                        siValue={concreteEnvelope.result.batchCementKg}
                        currentUnitId={getOutputUnit('mix.out.cement', 'mass', 'bag50')}
                        onUnitChange={(u) => updateOutputUnit('mix.out.cement', u)}
                        customUnits={appState.customUnits}
                        highlight={true}
                        subText={`Target: ${activeWorkspace.concrete.targetStrengthMpa} MPa`}
                      />
                      <UnitValueDisplay
                        label="Coarse Agg Dry Mass"
                        category="mass"
                        siValue={concreteEnvelope.result.batchCoarseAggKg}
                        currentUnitId={getOutputUnit('mix.out.coarse', 'mass', 'kg')}
                        onUnitChange={(u) => updateOutputUnit('mix.out.coarse', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Fine Agg Dry Mass"
                        category="mass"
                        siValue={concreteEnvelope.result.batchFineAggKg}
                        currentUnitId={getOutputUnit('mix.out.fine', 'mass', 'kg')}
                        onUnitChange={(u) => updateOutputUnit('mix.out.fine', u)}
                        customUnits={appState.customUnits}
                      />
                    </div>
                  )}

                  {activeModule === 'open-channel' && channelEnvelope.result && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                      <UnitValueDisplay
                        label="Flow Discharge (Q)"
                        category="flow_rate"
                        siValue={channelEnvelope.result.dischargeM3ps}
                        currentUnitId={getOutputUnit('hyd.out.Q', 'flow_rate', 'm3/s')}
                        onUnitChange={(u) => updateOutputUnit('hyd.out.Q', u)}
                        customUnits={appState.customUnits}
                        highlight={true}
                      />
                      <UnitValueDisplay
                        label="Mean Velocity (V)"
                        category="velocity"
                        siValue={channelEnvelope.result.velocityMps}
                        currentUnitId={getOutputUnit('hyd.out.V', 'velocity', 'm/s')}
                        onUnitChange={(u) => updateOutputUnit('hyd.out.V', u)}
                        customUnits={appState.customUnits}
                      />
                      <UnitValueDisplay
                        label="Wetted Flow Area"
                        category="area"
                        siValue={channelEnvelope.result.flowAreaM2}
                        currentUnitId={getOutputUnit('hyd.out.A', 'area', 'm2')}
                        onUnitChange={(u) => updateOutputUnit('hyd.out.A', u)}
                        customUnits={appState.customUnits}
                      />
                      <div className="p-3 rounded-xl border bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)]">
                        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-semibold">Froude Number (Fr)</div>
                        <div className="text-xl font-bold font-mono text-[var(--md-sys-color-on-surface)] mt-0.5">
                          Fr = {channelEnvelope.result.froudeNumber.toFixed(3)}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 capitalize">
                          Regime: {channelEnvelope.result.flowRegime}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* DYNAMIC MEASUREMENT SHEET (L x W x H) & BOQ SPREADSHEET TABLE */}
                {activeModule === 'boq-estimator' && boqEnvelope.result && (
                  <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                      <div>
                        <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                          <span>Dynamic Measurement Sheet (L × W × H)</span>
                        </h2>
                        <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          Itemized Takeoff & Cost Quantification ({boqEnvelope.result.items.length} Lines)
                        </span>
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
                        {(['all', 'earthwork', 'substructure', 'superstructure', 'rebar', 'masonry', 'finishing'] as const).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setBoqCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                              boqCategoryFilter === cat
                                ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                                : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] font-bold">
                            <th className="py-2.5 px-2">Item #</th>
                            <th className="py-2.5 px-2">Description</th>
                            <th className="py-2.5 px-2 text-center">Nos</th>
                            <th className="py-2.5 px-2 text-right">L (m)</th>
                            <th className="py-2.5 px-2 text-right">W (m)</th>
                            <th className="py-2.5 px-2 text-right">H (m)</th>
                            <th className="py-2.5 px-2 text-right">Ded.</th>
                            <th className="py-2.5 px-2 text-center">Unit</th>
                            <th className="py-2.5 px-2 text-right">Billable</th>
                            <th className="py-2.5 px-2 text-right">Rate ({boqEnvelope.result.currencySymbol})</th>
                            <th className="py-2.5 px-2 text-right">Total ({boqEnvelope.result.currencySymbol})</th>
                            <th className="py-2.5 px-2 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                          {filteredBOQItems.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="py-12 text-center">
                                <div className="flex flex-col items-center justify-center space-y-2 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                                  <FileSpreadsheet className="w-8 h-8 text-[var(--md-sys-color-outline)]" />
                                  <p className="font-semibold text-sm text-[var(--md-sys-color-on-surface)]">
                                    Takeoff Spreadsheet is Empty
                                  </p>
                                  <p className="max-w-md text-xs">
                                    This project currently has no takeoff line items. Append items using the form on the left, or quickly load sample engineering data.
                                  </p>
                                  <div className="pt-2 flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={handleLoadSampleBOQItems}
                                      className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Load Demo Takeoffs (7 Items)</span>
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredBOQItems.map((it) => (
                              <tr key={it.id} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                                <td className="py-2 px-2 font-bold text-[var(--md-sys-color-primary)] whitespace-nowrap">
                                  {it.itemNo}
                                </td>
                              <td className="py-2 px-2 min-w-[180px]">
                                <div className="font-semibold text-[var(--md-sys-color-on-surface)] truncate max-w-xs">{it.description}</div>
                                <span className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)]">
                                  [{it.category}]
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center">{it.numberOfMembers}</td>
                              <td className="py-2 px-2 text-right">{it.lengthM > 0 ? it.lengthM.toFixed(2) : '-'}</td>
                              <td className="py-2 px-2 text-right">{it.widthM > 0 ? it.widthM.toFixed(2) : '-'}</td>
                              <td className="py-2 px-2 text-right">{it.heightM > 0 ? it.heightM.toFixed(2) : '-'}</td>
                              <td className="py-2 px-2 text-right text-[var(--md-sys-color-error)]">
                                {it.deductionQty > 0 ? `-${it.deductionQty.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-2 text-center font-bold">{it.unit}</td>
                              <td className="py-2 px-2 text-right font-bold">
                                {it.totalBillableQty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                {it.wastagePercent > 0 && (
                                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] block font-normal">
                                    +{it.wastagePercent}% wst
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right font-semibold">
                                {it.unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-2 text-right font-bold text-[var(--md-sys-color-on-surface)] whitespace-nowrap">
                                {it.itemTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-2 text-center whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleEditTakeoffItem(it)}
                                    className="p-1 hover:text-[var(--md-sys-color-primary)] cursor-pointer"
                                    title="Edit Line Item"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateTakeoffItem(it)}
                                    className="p-1 hover:text-[var(--md-sys-color-tertiary)] cursor-pointer"
                                    title="Duplicate Line Item"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTakeoffItem(it.id)}
                                    className="p-1 hover:text-[var(--md-sys-color-error)] cursor-pointer"
                                    title="Delete Line Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Reconciliation Summary Card */}
                    <div className="p-4 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[var(--md-sys-color-on-surface-variant)]">Direct Takeoff Subtotal:</span>
                        <span className="font-bold">{boqEnvelope.result.currencySymbol} {boqEnvelope.result.subtotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Contingency Reserve ({boqEnvelope.result.contingencyPercent}%):</span>
                        <span>{boqEnvelope.result.currencySymbol} {boqEnvelope.result.contingencyAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Contractor Profit & Overhead CP&OH ({boqEnvelope.result.contractorOverheadPercent}%):</span>
                        <span className="text-[var(--md-sys-color-tertiary)] font-bold">{boqEnvelope.result.currencySymbol} {boqEnvelope.result.contractorOverheadAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-[var(--md-sys-color-on-surface-variant)]">+ Statutory VAT / Tax ({boqEnvelope.result.vatTaxPercent}%):</span>
                        <span>{boqEnvelope.result.currencySymbol} {boqEnvelope.result.vatTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)] flex justify-between items-center text-base font-mono font-bold text-[var(--md-sys-color-primary)]">
                        <span>ESTIMATED GRAND TOTAL BOQ ({boqEnvelope.result.currency}):</span>
                        <span className="text-xl font-extrabold">{boqEnvelope.result.currencySymbol} {boqEnvelope.result.grandTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* RATE ANALYSIS COMPOSITE BREAKDOWN TABLES */}
                {activeModule === 'rate-analysis' && rateAnalysisEnvelope.result && (
                  <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                      <div>
                        <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                          <span>Granular Cost Rate Analysis</span>
                        </h2>
                        <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                          {rateAnalysisEnvelope.result.workDescription} ({rateAnalysisEnvelope.result.basisVolumeM3} m³)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono block text-[var(--md-sys-color-on-surface-variant)]">Composite Unit Rate</span>
                        <span className="text-lg font-bold font-mono text-[var(--md-sys-color-primary)]">
                          {rateAnalysisEnvelope.result.currencySymbol} {rateAnalysisEnvelope.result.unitRatePerM3.toFixed(2)} / m³
                        </span>
                      </div>
                    </div>

                    {/* Materials Breakdown */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                        1. Direct Material Components
                      </h3>
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container-low)]">
                            <th className="py-2 px-2 text-left">Material</th>
                            <th className="py-2 px-2 text-right">Quantity</th>
                            <th className="py-2 px-2 text-center">Unit</th>
                            <th className="py-2 px-2 text-right">Rate ({rateAnalysisEnvelope.result.currencySymbol})</th>
                            <th className="py-2 px-2 text-right">Cost ({rateAnalysisEnvelope.result.currencySymbol})</th>
                            <th className="py-2 px-2 text-right">%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                          {rateAnalysisEnvelope.result.materials.map((m, i) => (
                            <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                              <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{m.name}</td>
                              <td className="py-1.5 px-2 text-right">{m.quantity}</td>
                              <td className="py-1.5 px-2 text-center">{m.unit}</td>
                              <td className="py-1.5 px-2 text-right">{m.unitPrice.toLocaleString()}</td>
                              <td className="py-1.5 px-2 text-right font-bold">{m.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-1.5 px-2 text-right text-[var(--md-sys-color-on-surface-variant)]">{m.percentageOfMaterial}%</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                            <td colSpan={4} className="py-2 px-2 text-left">Materials Subtotal:</td>
                            <td className="py-2 px-2 text-right text-[var(--md-sys-color-primary)]">
                              {rateAnalysisEnvelope.result.currencySymbol} {rateAnalysisEnvelope.result.materialsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Labor Breakdown */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                        2. Direct Labor & Craftsmanship
                      </h3>
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container-low)]">
                            <th className="py-2 px-2 text-left">Trade</th>
                            <th className="py-2 px-2 text-right">Days</th>
                            <th className="py-2 px-2 text-right">Daily Wage ({rateAnalysisEnvelope.result.currencySymbol})</th>
                            <th className="py-2 px-2 text-right">Cost ({rateAnalysisEnvelope.result.currencySymbol})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                          {rateAnalysisEnvelope.result.labors.map((l, i) => (
                            <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                              <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{l.trade}</td>
                              <td className="py-1.5 px-2 text-right">{l.daysRequired}</td>
                              <td className="py-1.5 px-2 text-right">{l.dailyWage.toLocaleString()}</td>
                              <td className="py-1.5 px-2 text-right font-bold">{l.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                            <td colSpan={3} className="py-2 px-2 text-left">Labor Subtotal:</td>
                            <td className="py-2 px-2 text-right text-[var(--md-sys-color-tertiary)]">
                              {rateAnalysisEnvelope.result.currencySymbol} {rateAnalysisEnvelope.result.laborsCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Equipment & Scaffolding Breakdown */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-2">
                        3. Equipment Plant & Formwork Centering
                      </h3>
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] font-bold bg-[var(--md-sys-color-surface-container-low)]">
                            <th className="py-2 px-2 text-left">Plant / Formwork</th>
                            <th className="py-2 px-2 text-right">Rate / Unit</th>
                            <th className="py-2 px-2 text-right">Total ({rateAnalysisEnvelope.result.currencySymbol})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--md-sys-color-outline-variant)]">
                          {rateAnalysisEnvelope.result.equipment.map((eq, i) => (
                            <tr key={i} className="hover:bg-[var(--md-sys-color-surface-container-low)]">
                              <td className="py-1.5 px-2 font-semibold text-[var(--md-sys-color-on-surface)]">{eq.equipment}</td>
                              <td className="py-1.5 px-2 text-right">{eq.ratePerUnit.toLocaleString()}</td>
                              <td className="py-1.5 px-2 text-right font-bold">{eq.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                            <td colSpan={2} className="py-2 px-2 text-left">Equipment Subtotal:</td>
                            <td className="py-2 px-2 text-right">
                              {rateAnalysisEnvelope.result.currencySymbol} {rateAnalysisEnvelope.result.equipmentCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Calculation History */}
                <div className="bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                    <div className="flex items-center gap-2">
                      <LogoMark size={20} className="text-[var(--md-sys-color-primary)]" />
                      <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                        Calculation History Ledger
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={historyScope}
                        onChange={(e) => setHistoryScope(e.target.value as 'active-project' | 'all-projects')}
                        className="touch-target-48 px-2 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-mono bg-[var(--md-sys-color-surface)]"
                      >
                        <option value="active-project">Active Project Only ({activeWorkspace.projectCode})</option>
                        <option value="all-projects">All Projects Across Lab</option>
                      </select>
                      <span className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                        {filteredHistory.length} Entries
                      </span>
                      {filteredHistory.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearHistory}
                          className="px-2 py-1 rounded text-xs font-mono text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)]/20 cursor-pointer"
                          title="Clear history records"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--md-sys-color-outline-variant)] mt-2">
                    {filteredHistory.length === 0 ? (
                      <div className="py-8 text-center text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] space-y-2">
                        <div>No calculation snapshots logged for this project yet. Use &quot;Log Snapshot&quot; above to capture records.</div>
                        <button
                          type="button"
                          onClick={handleLoadSampleHistory}
                          className="px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                          <span>Load Sample History Records</span>
                        </button>
                      </div>
                    ) : (
                      filteredHistory.map((rec) => (
                        <div key={rec.id} className="py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                              {rec.id.slice(0, 8)} · {new Date(rec.timestamp).toLocaleTimeString()} · <span className="font-bold text-[var(--md-sys-color-primary)]">[{rec.moduleId}]</span>
                            </div>
                            <div className="text-sm font-semibold truncate">{rec.title}</div>
                            <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] truncate mt-0.5">{rec.notes}</div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-mono">
                              {rec.keyMetrics.map((m) => (
                                <span key={m.label}>
                                  {m.label}: <strong>{m.value} {m.unit}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistoryItem(rec.id)}
                            className="touch-target-48 px-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>

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

        {/* PROJECT WORKSPACES MANAGER MODAL */}
        {workspaceManagerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-3xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h2 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <FolderArchive className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                    <span>Project Workspaces Manager</span>
                  </h2>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Manage multi-project engineering workspaces, dedicated takeoff sheets, and validated JSON exports
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkspaceManagerOpen(false)}
                  className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[var(--md-sys-color-surface-container)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceManagerOpen(false);
                      handleOpenNewWorkspace();
                    }}
                    className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Project</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => projectFileInputRef.current?.click()}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <span>Import Project JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddDemoProject}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-xs font-bold inline-flex items-center gap-1.5 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/40 cursor-pointer"
                    title="Load sample Padma River Viaduct project with 7 takeoffs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load Demo Project</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExportStateJson}
                  className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[var(--md-sys-color-tertiary)]" />
                  <span>Export All Projects (Bundle JSON)</span>
                </button>
              </div>

              {/* Workspaces List */}
              <div className="space-y-3">
                {appState.workspaces.map((ws) => {
                  const isActive = ws.id === activeWorkspace.id;
                  const boqItemsCount = ws.boq?.items?.length || 0;
                  const historyCount = appState.calculationHistory.filter((rec) => rec.workspaceId === ws.id).length;
                  const sym = getCurrencySymbol(ws.currency || 'BDT');

                  return (
                    <div
                      key={ws.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 ring-1 ring-[var(--md-sys-color-primary)]'
                          : 'border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-outline)]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate">
                              {ws.name}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-[var(--md-sys-color-on-surface-variant)] mt-1 flex flex-wrap items-center gap-2">
                            <span>Code: <strong>{ws.projectCode}</strong></span>
                            <span>·</span>
                            <span>Site: {ws.siteLocation}</span>
                            <span>·</span>
                            <span>EOR: {ws.engineerOfRecord}</span>
                            <span>·</span>
                            <span className="font-bold text-[var(--md-sys-color-primary)]">Currency: {ws.currency || 'BDT'} ({sym})</span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--md-sys-color-on-surface-variant)]">
                            <span className="p-1 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                              📋 <strong>{boqItemsCount}</strong> Takeoff Items
                            </span>
                            <span className="p-1 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                              📑 <strong>{historyCount}</strong> History Logs
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                setAppState((prev) => ({ ...prev, activeWorkspaceId: ws.id }));
                                setToastBanner(`Switched active workspace to "${ws.name}"`);
                              }}
                              className="touch-target-48 px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] text-xs font-bold text-[var(--md-sys-color-primary)] cursor-pointer"
                            >
                              Switch To
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditWorkspace(ws)}
                            className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                            title="Edit Project Metadata"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDuplicateWorkspace(ws)}
                            className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-tertiary)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                            title="Duplicate Project Workspace"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportSingleProject(ws)}
                            className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                            title="Export Project (.json)"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {appState.workspaces.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteWorkspace(ws.id)}
                              className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                              title="Delete Project Workspace"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* EDIT WORKSPACE METADATA MODAL */}
        {editWsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-md bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Edit Project Metadata
                </h2>
                <button type="button" onClick={() => setEditWsModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditWorkspace} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={editWsName}
                    onChange={(e) => setEditWsName(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Code</label>
                  <input
                    type="text"
                    required
                    value={editWsCode}
                    onChange={(e) => setEditWsCode(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jobsite Location</label>
                  <input
                    type="text"
                    value={editWsSite}
                    onChange={(e) => setEditWsSite(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Engineer of Record (EOR)</label>
                  <input
                    type="text"
                    value={editWsEngineer}
                    onChange={(e) => setEditWsEngineer(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Default Currency</label>
                  <select
                    value={editWsCurrency}
                    onChange={(e) => setEditWsCurrency(e.target.value as CurrencyCode)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditWsModalOpen(false)}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="touch-target-48 px-4 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE NEW WORKSPACE MODAL */}
        {newWorkspaceOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-md bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                  Create New Project Workspace
                </h2>
                <button type="button" onClick={() => setNewWorkspaceOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka Metro Line 5 — Station Box"
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Project Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CIV-2026-DML5"
                    value={newWsCode}
                    onChange={(e) => setNewWsCode(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Jobsite Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Mirpur Sector 10"
                    value={newWsSite}
                    onChange={(e) => setNewWsSite(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Engineer of Record (EOR)</label>
                  <input
                    type="text"
                    placeholder="e.g. P. Biswas, PE"
                    value={newWsEngineer}
                    onChange={(e) => setNewWsEngineer(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Default Currency</label>
                  <select
                    value={newWsCurrency}
                    onChange={(e) => setNewWsCurrency(e.target.value as CurrencyCode)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Takeoff Spreadsheet Initial State</label>
                  <div className="space-y-1.5 text-xs font-mono">
                    <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${newWsTemplate === 'clean' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 font-bold' : 'border-[var(--md-sys-color-outline-variant)]'}`}>
                      <input
                        type="radio"
                        name="newWsTemplate"
                        value="clean"
                        checked={newWsTemplate === 'clean'}
                        onChange={() => setNewWsTemplate('clean')}
                      />
                      <span>Clean Blank Slate (0 Takeoff Items)</span>
                    </label>
                    <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${newWsTemplate === 'clone' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 font-bold' : 'border-[var(--md-sys-color-outline-variant)]'}`}>
                      <input
                        type="radio"
                        name="newWsTemplate"
                        value="clone"
                        checked={newWsTemplate === 'clone'}
                        onChange={() => setNewWsTemplate('clone')}
                      />
                      <span>Copy Items from Active Project ({activeWorkspace.boq.items.length} Items)</span>
                    </label>
                    <label className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 ${newWsTemplate === 'demo' ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/10 font-bold' : 'border-[var(--md-sys-color-outline-variant)]'}`}>
                      <input
                        type="radio"
                        name="newWsTemplate"
                        value="demo"
                        checked={newWsTemplate === 'demo'}
                        onChange={() => setNewWsTemplate('demo')}
                      />
                      <span>Pre-load Padma Viaduct Demo Items (7 Items)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWorkspaceOpen(false)}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="touch-target-48 px-4 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CUSTOM UNIT MANAGER MODAL */}
        {customUnitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Custom Engineering Unit Manager
                  </h2>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    Define and persist project-specific or local customary units
                  </p>
                </div>
                <button type="button" onClick={() => setCustomUnitModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form to add unit */}
              <form onSubmit={handleCreateCustomUnit} className="mt-4 p-4 rounded-lg bg-[var(--md-sys-color-surface-container)] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-primary)]">
                  Add New Jobsite Unit
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Unit Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tipper Truck"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Unit Symbol</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. truck"
                      value={newUnitSymbol}
                      onChange={(e) => setNewUnitSymbol(e.target.value)}
                      className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Discipline Category</label>
                    <select
                      value={newUnitCategory}
                      onChange={(e) => setNewUnitCategory(e.target.value as UnitCategoryKey)}
                      className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                    >
                      <option value="length">Length</option>
                      <option value="area">Area / Land</option>
                      <option value="volume">Volume / CFT</option>
                      <option value="mass">Mass / Bags</option>
                      <option value="pressure">Pressure / Stress</option>
                      <option value="force">Force</option>
                      <option value="slope">Slope / Gradient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Multiplier to SI Base ({BASE_UNITS[newUnitCategory]})
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 10.0"
                      value={newUnitFactor}
                      onChange={(e) => setNewUnitFactor(Number(e.target.value))}
                      className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Description / Jobsite Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard 3-axle 10 m³ hauling dump truck"
                    value={newUnitDesc}
                    onChange={(e) => setNewUnitDesc(e.target.value)}
                    className="w-full touch-target-48 px-3 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full touch-target-48 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold text-xs"
                >
                  Save Custom Engineering Unit
                </button>
              </form>

              {/* List of custom units */}
              <div className="mt-5 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Active Custom Units ({appState.customUnits.length})
                </div>
                {appState.customUnits.map((u) => (
                  <div key={u.id} className="p-3 rounded-lg border border-[var(--md-sys-color-outline-variant)] flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs">{u.name} ({u.symbol})</div>
                      <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)]">
                        1 {u.symbol} = {u.toBaseFactor} {BASE_UNITS[u.category]} · {u.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomUnit(u.id)}
                      className="touch-target-48 px-2 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-error)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Persistence Inspector Modal */}
        {inspectorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                    Local-First Schema v2 Storage Diagnostics
                  </h2>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    PB CivilLab offline persistence and schema state inspector
                  </p>
                </div>
                <button type="button" onClick={() => setInspectorModalOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
                  <div className="text-[var(--md-sys-color-on-surface-variant)]">Schema Version</div>
                  <div className="text-base font-bold">{appState.schemaVersion}</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
                  <div className="text-[var(--md-sys-color-on-surface-variant)]">Workspaces</div>
                  <div className="text-base font-bold">{appState.workspaces.length}</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
                  <div className="text-[var(--md-sys-color-on-surface-variant)]">Custom Units</div>
                  <div className="text-base font-bold">{appState.customUnits.length}</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--md-sys-color-surface-container)]">
                  <div className="text-[var(--md-sys-color-on-surface-variant)]">History Logs</div>
                  <div className="text-base font-bold">{appState.calculationHistory.length}</div>
                </div>
              </div>

              {/* Dual-Layer Local-First Storage Health Card */}
              <div className="p-3.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface)]">
                      Dual-Layer Local-First Persistence Architecture
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--md-sys-color-success)]/15 text-[var(--md-sys-color-success)] border border-[var(--md-sys-color-success)]/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Zero-Data-Loss Active</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="text-[var(--md-sys-color-on-surface-variant)] text-[10px]">Tier 1: Synchronous Web Storage</div>
                    <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">localStorage ({STORAGE_KEY})</div>
                    <div className="text-[10px] text-[var(--md-sys-color-success)] flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Instant in-memory & session reload</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                    <div className="text-[var(--md-sys-color-on-surface-variant)] text-[10px]">Tier 2: Asynchronous Resilient DB</div>
                    <div className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">
                      IndexedDB (pb_civillab_db)
                    </div>
                    <div className="text-[10px] text-[var(--md-sys-color-primary)] flex items-center gap-1 mt-1">
                      {idbDiagnostics.supported ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            {idbDiagnostics.hasStoredState ? `Synced (~${Math.round(idbDiagnostics.approxSizeChars / 1024 * 10) / 10} KB)` : 'Ready & Connected'}
                          </span>
                        </>
                      ) : (
                        <span>Fallback mode</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--md-sys-color-outline-variant)]">
                  <button
                    type="button"
                    onClick={handleForceIdbSync}
                    disabled={idbDiagnostics.syncing}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[var(--md-sys-color-surface)] cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>{idbDiagnostics.syncing ? 'Backing up...' : 'Backup to IndexedDB Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreFromIdb}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[var(--md-sys-color-surface)] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)]" />
                    <span>Restore from IndexedDB</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]">
                  Storage Management & State Controls
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleResetToClean}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container)] text-xs font-semibold inline-flex items-center gap-1.5 hover:border-[var(--md-sys-color-primary)] cursor-pointer"
                    title="Initialize clean project with 0 takeoff items and 0 logs"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--md-sys-color-error)]" />
                    <span>Reset to Clean Slate (0 Items)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadDemoDataset}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-xs font-bold inline-flex items-center gap-1.5 text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/40 cursor-pointer"
                    title="Load complete Padma River Viaduct demo project with 7 takeoffs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Load Demo Dataset (Padma Viaduct)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportStateJson}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const migrated = simulateV1MigrationSample();
                      setAppState(migrated);
                      setToastBanner('Simulated Legacy Schema v1 → v2 Migration.');
                    }}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Test v1 Migration</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTriggerErrorTest(true)}
                    className="touch-target-48 px-3 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bug className="w-4 h-4" />
                    <span>Test ErrorBoundary</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Isolated container for pristine vector print / PDF execution */}
        <div id="pb-printable-report" className="hidden"></div>
      </div>
    </ErrorBoundary>
  );
}
