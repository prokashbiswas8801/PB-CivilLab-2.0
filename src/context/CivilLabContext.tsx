import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES & DEFINITIONS
// ============================================================================

export type ActivePage =
  | 'home'
  | 'all'
  | 'search'
  | 'converter'
  | 'profile'
  | 'history'
  | 'calculator';

export type EngineeringThemeOption =
  | 'obsidian-gold'
  | 'terracotta-studio'
  | 'editorial-parchment'
  | 'solar-amber'
  | 'emerald-botanical';

export interface CivilProjectItem {
  id: string;
  name: string;
  code: string;
  clientName?: string;
  location?: string;
  currency?: string;
  createdAt: string;
}

export interface CivilUserProfile {
  name: string;
  title: string;
  organization: string;
  licenseNo: string;
  email: string;
  phone?: string;
  location?: string;
  defaultUnitSystem: 'SI' | 'Imperial' | 'Regional';
  defaultDesignCode?: string;
  theme: EngineeringThemeOption;
  autoCollapseLandscape?: boolean;
  showShortcutBadges?: boolean;
  activeProjectId?: string;
  projects: CivilProjectItem[];
}

export interface CivilPdfPreset {
  paperSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  marginMm: number;
  includeHeader: boolean;
  includeFooter: boolean;
  includeQR: boolean;
  includeFormulaSteps: boolean;
  includeDiagram?: boolean;
  includeSignatureBlock?: boolean;
  showProjectMetadata?: boolean;
  customHeaderTitle: string;
  companySubtitle?: string;
  signatoryName: string;
}

export interface SavedHistoryItem {
  id: string;
  type: 'calculation' | 'conversion';
  title: string;
  moduleId?: string;
  timestamp: string;
  summary: string;
  status?: 'nominal' | 'warning' | 'critical' | 'valid';
  keyMetrics?: Array<{ label: string; value: string | number; unit?: string }>;
  inputs?: Record<string, any> | null;
  results?: Record<string, any> | null;
  unitSystem?: 'SI' | 'Imperial' | 'Regional';
  notes?: string;
  tags?: string[];
}

export interface CivilLabContextType {
  // Navigation & Calculator State
  activePage: ActivePage;
  activeCalculatorId: string | null;
  setActivePage: (page: ActivePage, calculatorId?: string | null) => void;
  navigateToCalculator: (calculatorId: string) => void;

  // Dock Collapse State
  isDockCollapsed: boolean;
  setIsDockCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleDockCollapsed: () => void;

  // Pinned Tools
  pinnedTools: string[];
  togglePinTool: (toolId: string) => void;
  isToolPinned: (toolId: string) => boolean;
  setPinnedTools: React.Dispatch<React.SetStateAction<string[]>>;

  // Search History
  searchHistory: string[];
  addSearchQuery: (query: string) => void;
  removeSearchQuery: (query: string) => void;
  clearSearchHistory: () => void;

  // Saved History (never auto-deleted, persists until user deletes)
  savedHistory: SavedHistoryItem[];
  addSavedHistoryItem: (item: Omit<SavedHistoryItem, 'id' | 'timestamp'>) => SavedHistoryItem;
  deleteSavedHistoryItem: (id: string) => void;
  clearSavedHistory: () => void;
  importSavedHistory: (items: SavedHistoryItem[]) => number;

  // User Profile
  userProfile: CivilUserProfile;
  updateUserProfile: (partial: Partial<CivilUserProfile>) => void;
  addProject: (project: Omit<CivilProjectItem, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, partial: Partial<CivilProjectItem>) => void;
  removeProject: (id: string) => void;
  selectActiveProject: (id: string) => void;

  // PDF Export Preset
  pdfPreset: CivilPdfPreset;
  updatePdfPreset: (partial: Partial<CivilPdfPreset>) => void;
}

// ============================================================================
// STORAGE KEYS & ROBUST DEFAULTS
// ============================================================================

export const CIVILLAB_CONTEXT_VERSION_KEY = 'pb_civillab_context_version';
export const CURRENT_CIVILLAB_CONTEXT_VERSION = 'v3_clean';

const STORAGE_KEYS = {
  ACTIVE_PAGE: 'pb_civillab_active_page_v3',
  ACTIVE_CALC_ID: 'pb_civillab_active_calc_id_v3',
  IS_DOCK_COLLAPSED: 'pb_civillab_dock_collapsed_v3',
  PINNED_TOOLS: 'pb_civillab_pinned_tools_v3',
  SEARCH_HISTORY: 'pb_civillab_search_history_v3',
  SAVED_HISTORY: 'pb_civillab_saved_history_v3',
  USER_PROFILE: 'pb_civillab_user_profile_v3',
  PDF_PRESET: 'pb_civillab_pdf_preset_v3',
};

const DEFAULT_USER_PROFILE: CivilUserProfile = {
  name: 'Prokash Biswas',
  title: 'Principal Civil & Structural Engineer',
  organization: 'PB Civil Engineering Consultancy',
  licenseNo: 'PE-8801-BD',
  email: 'prokashbiswas8801@gmail.com',
  phone: '+880 1712-345678',
  location: 'Dhaka, Bangladesh',
  defaultUnitSystem: 'SI',
  defaultDesignCode: 'BNBC 2020',
  theme: 'obsidian-gold',
  autoCollapseLandscape: true,
  showShortcutBadges: true,
  activeProjectId: 'proj-001',
  projects: [
    {
      id: 'proj-001',
      name: 'Padma Bridge River Viaduct & Pier Caps',
      code: 'PBCL-2026-VIAD',
      clientName: 'Bangladesh Bridge Authority (BBA)',
      location: 'Mawa-Janjira Sector, Bangladesh',
      currency: 'BDT',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'proj-002',
      name: 'High-Rise Commercial Mat & Bored Piles',
      code: 'PBCL-2026-MAT',
      clientName: 'Eastern Housing & Commercial Ltd.',
      location: 'Chittagong Port City, Bangladesh',
      currency: 'BDT',
      createdAt: new Date().toISOString(),
    },
  ],
};

const DEFAULT_PDF_PRESET: CivilPdfPreset = {
  paperSize: 'a4',
  orientation: 'portrait',
  marginMm: 15,
  includeHeader: true,
  includeFooter: true,
  includeQR: true,
  includeFormulaSteps: true,
  includeDiagram: true,
  includeSignatureBlock: true,
  showProjectMetadata: true,
  customHeaderTitle: 'Official Structural & Geotechnical Submittal Sheet',
  companySubtitle: 'PB Civil Engineering Consultancy · Verified Engineering Calculations',
  signatoryName: 'Prokash Biswas, PE',
};

const DEFAULT_PINNED_TOOLS: string[] = [
  'beam-analysis',
  'bearing-capacity',
  'rebar-bbs',
  'unit-converter',
  'concrete-mix',
  'boq-estimator',
];

const DEFAULT_SEARCH_HISTORY: string[] = [];

const INITIAL_SAVED_HISTORY: SavedHistoryItem[] = [];

// ============================================================================
// CONTEXT CREATION & PROVIDER
// ============================================================================

const CivilLabContext = createContext<CivilLabContextType | undefined>(undefined);

export const CivilLabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge previous user logs on version mismatch while retaining system settings
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedVer = localStorage.getItem(CIVILLAB_CONTEXT_VERSION_KEY);
      if (storedVer !== CURRENT_CIVILLAB_CONTEXT_VERSION) {
        console.info('[CivilLabContext] Version mismatch detected. Purging previous user logs while retaining system settings.');
        localStorage.removeItem('pb_civillab_saved_history_v2');
        localStorage.removeItem('pb_civillab_saved_history_v1');
        localStorage.removeItem('pb_civillab_search_history_v2');
        localStorage.removeItem('pb_civillab_search_history_v1');
        localStorage.removeItem(STORAGE_KEYS.SAVED_HISTORY);
        localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);

        // Migrate system settings if not already present in v3
        const oldProfile = localStorage.getItem('pb_civillab_user_profile_v2');
        if (oldProfile && !localStorage.getItem(STORAGE_KEYS.USER_PROFILE)) {
          localStorage.setItem(STORAGE_KEYS.USER_PROFILE, oldProfile);
        }
        const oldPdf = localStorage.getItem('pb_civillab_pdf_preset_v2');
        if (oldPdf && !localStorage.getItem(STORAGE_KEYS.PDF_PRESET)) {
          localStorage.setItem(STORAGE_KEYS.PDF_PRESET, oldPdf);
        }
        const oldPinned = localStorage.getItem('pb_civillab_pinned_tools_v2');
        if (oldPinned && !localStorage.getItem(STORAGE_KEYS.PINNED_TOOLS)) {
          localStorage.setItem(STORAGE_KEYS.PINNED_TOOLS, oldPinned);
        }

        localStorage.setItem(CIVILLAB_CONTEXT_VERSION_KEY, CURRENT_CIVILLAB_CONTEXT_VERSION);
      }
    } catch (e) {
      console.warn('[CivilLabContext] Purge error:', e);
    }
  }
  // 1. Active Page & Active Calculator
  const [activePage, setActivePageState] = useState<ActivePage>(() => {
    if (typeof window === 'undefined') return 'home';
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_PAGE);
      if (saved && ['home', 'all', 'search', 'converter', 'profile', 'history', 'calculator'].includes(saved)) {
        return saved as ActivePage;
      }
    } catch {
      // Fallback
    }
    return 'home';
  });

  const [activeCalculatorId, setActiveCalculatorId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CALC_ID) || null;
    } catch {
      return null;
    }
  });

  const setActivePage = useCallback((page: ActivePage, calculatorId?: string | null) => {
    setActivePageState(page);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PAGE, page);
    } catch {
      // Ignore
    }
    if (calculatorId !== undefined) {
      setActiveCalculatorId(calculatorId);
      try {
        if (calculatorId) {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_CALC_ID, calculatorId);
        } else {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_CALC_ID);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const navigateToCalculator = useCallback((calculatorId: string) => {
    setActivePageState('calculator');
    setActiveCalculatorId(calculatorId);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PAGE, 'calculator');
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CALC_ID, calculatorId);
    } catch {
      // Ignore
    }
  }, []);

  // 2. Dock Collapsed State (Local-first persistence)
  const [isDockCollapsed, setIsDockCollapsedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IS_DOCK_COLLAPSED);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const setIsDockCollapsed = useCallback((collapsed: boolean | ((prev: boolean) => boolean)) => {
    setIsDockCollapsedState((prev) => {
      const next = typeof collapsed === 'function' ? collapsed(prev) : collapsed;
      try {
        localStorage.setItem(STORAGE_KEYS.IS_DOCK_COLLAPSED, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const toggleDockCollapsed = useCallback(() => {
    setIsDockCollapsed((prev) => !prev);
  }, [setIsDockCollapsed]);

  // 3. Pinned Tools
  const [pinnedTools, setPinnedTools] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PINNED_TOOLS;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PINNED_TOOLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PINNED_TOOLS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PINNED_TOOLS, JSON.stringify(pinnedTools));
    } catch {
      // Ignore
    }
  }, [pinnedTools]);

  const togglePinTool = useCallback((toolId: string) => {
    setPinnedTools((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  }, []);

  const isToolPinned = useCallback((toolId: string) => pinnedTools.includes(toolId), [pinnedTools]);

  // 4. Search History
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_SEARCH_HISTORY;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SEARCH_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(searchHistory));
    } catch {
      // Ignore
    }
  }, [searchHistory]);

  const addSearchQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20));
  }, []);

  const removeSearchQuery = useCallback((query: string) => {
    setSearchHistory((prev) => prev.filter((q) => q !== query));
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
    } catch {
      // Ignore
    }
  }, []);

  // 5. Saved History (Items NEVER auto-deleted; remain until explicit user action)
  const [savedHistory, setSavedHistory] = useState<SavedHistoryItem[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SAVED_HISTORY;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_SAVED_HISTORY;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_HISTORY, JSON.stringify(savedHistory));
    } catch {
      // Ignore
    }
  }, [savedHistory]);

  const addSavedHistoryItem = useCallback((item: Omit<SavedHistoryItem, 'id' | 'timestamp'>): SavedHistoryItem => {
    const newItem: SavedHistoryItem = {
      ...item,
      id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    // Prepend new item; never truncate or auto-delete
    setSavedHistory((prev) => [newItem, ...prev]);
    return newItem;
  }, []);

  const deleteSavedHistoryItem = useCallback((id: string) => {
    setSavedHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearSavedHistory = useCallback(() => {
    setSavedHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.SAVED_HISTORY);
    } catch {
      // Ignore
    }
  }, []);

  const importSavedHistory = useCallback((items: SavedHistoryItem[]): number => {
    if (!Array.isArray(items)) return 0;
    let addedCount = 0;
    setSavedHistory((prev) => {
      const existingIds = new Set(prev.map((x) => x.id));
      const newItems = items.filter((x) => x && x.id && !existingIds.has(x.id));
      addedCount = newItems.length;
      return [...newItems, ...prev];
    });
    return addedCount;
  }, []);

  // 6. User Profile
  const [userProfile, setUserProfile] = useState<CivilUserProfile>(() => {
    if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_USER_PROFILE, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_USER_PROFILE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
    } catch {
      // Ignore
    }
  }, [userProfile]);

  const updateUserProfile = useCallback((partial: Partial<CivilUserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...partial }));
  }, []);

  const addProject = useCallback((project: Omit<CivilProjectItem, 'id' | 'createdAt'>) => {
    const newProj: CivilProjectItem = {
      ...project,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUserProfile((prev) => ({
      ...prev,
      projects: [newProj, ...prev.projects],
      activeProjectId: newProj.id,
    }));
  }, []);

  const updateProject = useCallback((id: string, partial: Partial<CivilProjectItem>) => {
    setUserProfile((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...partial } : p)),
    }));
  }, []);

  const removeProject = useCallback((id: string) => {
    setUserProfile((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id),
      activeProjectId: prev.activeProjectId === id ? (prev.projects.find((p) => p.id !== id)?.id || '') : prev.activeProjectId,
    }));
  }, []);

  const selectActiveProject = useCallback((id: string) => {
    setUserProfile((prev) => ({
      ...prev,
      activeProjectId: id,
    }));
  }, []);

  // 7. PDF Export Preset
  const [pdfPreset, setPdfPreset] = useState<CivilPdfPreset>(() => {
    if (typeof window === 'undefined') return DEFAULT_PDF_PRESET;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PDF_PRESET);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PDF_PRESET, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PDF_PRESET;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PDF_PRESET, JSON.stringify(pdfPreset));
    } catch {
      // Ignore
    }
  }, [pdfPreset]);

  const updatePdfPreset = useCallback((partial: Partial<CivilPdfPreset>) => {
    setPdfPreset((prev) => ({ ...prev, ...partial }));
  }, []);

  const contextValue = useMemo<CivilLabContextType>(
    () => ({
      activePage,
      activeCalculatorId,
      setActivePage,
      navigateToCalculator,
      isDockCollapsed,
      setIsDockCollapsed,
      toggleDockCollapsed,
      pinnedTools,
      togglePinTool,
      isToolPinned,
      setPinnedTools,
      searchHistory,
      addSearchQuery,
      removeSearchQuery,
      clearSearchHistory,
      savedHistory,
      addSavedHistoryItem,
      deleteSavedHistoryItem,
      clearSavedHistory,
      importSavedHistory,
      userProfile,
      updateUserProfile,
      addProject,
      updateProject,
      removeProject,
      selectActiveProject,
      pdfPreset,
      updatePdfPreset,
    }),
    [
      activePage,
      activeCalculatorId,
      setActivePage,
      navigateToCalculator,
      isDockCollapsed,
      setIsDockCollapsed,
      toggleDockCollapsed,
      pinnedTools,
      togglePinTool,
      isToolPinned,
      searchHistory,
      addSearchQuery,
      removeSearchQuery,
      clearSearchHistory,
      savedHistory,
      addSavedHistoryItem,
      deleteSavedHistoryItem,
      clearSavedHistory,
      importSavedHistory,
      userProfile,
      updateUserProfile,
      addProject,
      updateProject,
      removeProject,
      selectActiveProject,
      pdfPreset,
      updatePdfPreset,
    ]
  );

  return <CivilLabContext.Provider value={contextValue}>{children}</CivilLabContext.Provider>;
};

export const useCivilLab = (): CivilLabContextType => {
  const context = useContext(CivilLabContext);
  if (!context) {
    throw new Error('useCivilLab must be used within a CivilLabProvider');
  }
  return context;
};
