import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { EngineeringModuleId } from '../types/civil';
import { roundEng } from '../utils/mathEngine';
import { formatFeetInches } from '../utils/unitConverter';

// ============================================================================
// TYPES & DEFINITIONS
// ============================================================================

export type GlobalUnitSystem = 'SI' | 'Imperial' | 'Regional';

export type EngineeringUnitCategory =
  | 'length'             // span: m <-> ft
  | 'section_dimension' // cross section / rebar: mm <-> in
  | 'area'              // m² <-> ft²
  | 'volume'            // m³ <-> ft³ (cft)
  | 'mass'              // kg <-> lb (or tonne <-> ton)
  | 'force'             // kN <-> kip
  | 'distributed_load'  // kN/m <-> kip/ft
  | 'stress'            // MPa <-> ksi (or psi)
  | 'pressure'          // kPa <-> psf (or psi)
  | 'density'           // kN/m³ <-> pcf (lb/ft³)
  | 'moment'            // kN·m <-> kip·ft
  | 'velocity'          // m/s <-> ft/s
  | 'flow_rate';        // m³/s <-> cfs (ft³/s)

export interface ProjectMetadata {
  projectName: string;
  projectCode: string;
  clientName: string;
  engineerName: string;
  projectLocation: string;
  date: string;
}

export interface CalculationSnapshot {
  id: string;
  timestamp: string;
  moduleId: EngineeringModuleId;
  moduleName: string;
  title: string;
  unitSystem: GlobalUnitSystem;
  status: 'valid' | 'warning' | 'invalid';
  summaryMetrics: Array<{ label: string; value: string | number; unit?: string }>;
  inputsSnapshot?: Record<string, unknown>;
  resultSnapshot?: Record<string, unknown>;
}

export interface UnitDescriptor {
  category: EngineeringUnitCategory;
  siSymbol: string;
  siName: string;
  imperialSymbol: string;
  imperialName: string;
  /** Multiply value in SI by this factor to obtain Imperial value */
  siToImperialFactor: number;
}

export const UNIT_REGISTRY: Record<EngineeringUnitCategory, UnitDescriptor> = {
  length: {
    category: 'length',
    siSymbol: 'm',
    siName: 'meters',
    imperialSymbol: 'ft',
    imperialName: 'feet',
    siToImperialFactor: 3.280839895013123,
  },
  section_dimension: {
    category: 'section_dimension',
    siSymbol: 'mm',
    siName: 'millimeters',
    imperialSymbol: 'in',
    imperialName: 'inches',
    siToImperialFactor: 1 / 25.4, // ~0.03937007874
  },
  area: {
    category: 'area',
    siSymbol: 'm²',
    siName: 'square meters',
    imperialSymbol: 'ft²',
    imperialName: 'square feet',
    siToImperialFactor: 10.763910416709722,
  },
  volume: {
    category: 'volume',
    siSymbol: 'm³',
    siName: 'cubic meters',
    imperialSymbol: 'cft',
    imperialName: 'cubic feet',
    siToImperialFactor: 35.31466672148859,
  },
  mass: {
    category: 'mass',
    siSymbol: 'kg',
    siName: 'kilograms',
    imperialSymbol: 'lb',
    imperialName: 'pounds',
    siToImperialFactor: 2.2046226218487757,
  },
  force: {
    category: 'force',
    siSymbol: 'kN',
    siName: 'kilonewtons',
    imperialSymbol: 'kip',
    imperialName: 'kilopounds (kips)',
    siToImperialFactor: 0.2248089430997105,
  },
  distributed_load: {
    category: 'distributed_load',
    siSymbol: 'kN/m',
    siName: 'kilonewtons per meter',
    imperialSymbol: 'kip/ft',
    imperialName: 'kips per linear foot',
    siToImperialFactor: 0.06852176585679177,
  },
  stress: {
    category: 'stress',
    siSymbol: 'MPa',
    siName: 'megapascals (N/mm²)',
    imperialSymbol: 'ksi',
    imperialName: 'kips per sq inch',
    siToImperialFactor: 0.14503773773020923,
  },
  pressure: {
    category: 'pressure',
    siSymbol: 'kPa',
    siName: 'kilopascals (kN/m²)',
    imperialSymbol: 'psf',
    imperialName: 'pounds per sq foot',
    siToImperialFactor: 20.88543423315013,
  },
  density: {
    category: 'density',
    siSymbol: 'kN/m³',
    siName: 'kilonewtons per cubic meter',
    imperialSymbol: 'pcf',
    imperialName: 'pounds per cubic foot',
    siToImperialFactor: 6.365881472502693,
  },
  moment: {
    category: 'moment',
    siSymbol: 'kN·m',
    siName: 'kilonewton-meters',
    imperialSymbol: 'kip·ft',
    imperialName: 'kip-feet',
    siToImperialFactor: 0.7375621492772654,
  },
  velocity: {
    category: 'velocity',
    siSymbol: 'm/s',
    siName: 'meters per second',
    imperialSymbol: 'ft/s',
    imperialName: 'feet per second',
    siToImperialFactor: 3.280839895013123,
  },
  flow_rate: {
    category: 'flow_rate',
    siSymbol: 'm³/s',
    siName: 'cubic meters per second',
    imperialSymbol: 'cfs',
    imperialName: 'cubic feet per second',
    siToImperialFactor: 35.31466672148859,
  },
};

// ============================================================================
// CONTEXT INTERFACE
// ============================================================================

export interface WorkbenchContextType {
  // Global Unit System
  unitSystem: GlobalUnitSystem;
  setUnitSystem: (system: GlobalUnitSystem) => void;
  toggleUnitSystem: () => void;
  getUnitSymbol: (category: EngineeringUnitCategory) => string;
  getUnitName: (category: EngineeringUnitCategory) => string;
  convertValue: (
    value: number,
    category: EngineeringUnitCategory,
    fromSystem: GlobalUnitSystem,
    toSystem: GlobalUnitSystem,
    decimals?: number
  ) => number;
  toActiveUnit: (valueInSI: number, category: EngineeringUnitCategory, decimals?: number) => number;
  fromActiveUnitToSI: (valueInActive: number, category: EngineeringUnitCategory, decimals?: number) => number;
  formatWithActiveUnit: (
    valueInSI: number,
    category: EngineeringUnitCategory,
    decimals?: number
  ) => string;
  formatFeetInches: (valueInFeetOrMeters: number, isMeters?: boolean) => string;

  // Project Metadata
  projectMetadata: ProjectMetadata;
  updateProjectMetadata: (partial: Partial<ProjectMetadata>) => void;
  resetProjectMetadata: () => void;

  // Recent & Favorite Tools
  recentTools: EngineeringModuleId[];
  recordToolUsage: (toolId: EngineeringModuleId) => void;
  favoriteTools: EngineeringModuleId[];
  toggleFavoriteTool: (toolId: EngineeringModuleId) => void;
  isFavoriteTool: (toolId: EngineeringModuleId) => boolean;

  // Calculation History & Snapshots
  calculationHistory: CalculationSnapshot[];
  saveCalculationSnapshot: (snapshot: Omit<CalculationSnapshot, 'id' | 'timestamp'>) => CalculationSnapshot;
  deleteCalculationSnapshot: (id: string) => void;
  clearCalculationHistory: () => void;
}

// ============================================================================
// STORAGE KEYS & DEFAULTS
// ============================================================================

export const WORKBENCH_VERSION_KEY = 'bd_civillab_workbench_version';
export const CURRENT_WORKBENCH_VERSION = 'v3_clean';

const STORAGE_KEYS = {
  UNIT_SYSTEM: 'bd_civillab_global_unit_system_v3',
  PROJECT_METADATA: 'bd_civillab_project_metadata_v3',
  RECENT_TOOLS: 'bd_civillab_recent_tools_v3',
  FAVORITE_TOOLS: 'bd_civillab_favorite_tools_v3',
  CALC_HISTORY: 'bd_civillab_calc_history_v3',
};

const DEFAULT_METADATA: ProjectMetadata = {
  projectName: 'Standard Civil Infrastructure Project',
  projectCode: 'BDCL-2026-DES',
  clientName: 'Public Works Department (PWD)',
  engineerName: 'Lead Structural & Civil Engineer',
  projectLocation: 'Dhaka Metropolitan Zone, Bangladesh',
  date: new Date().toISOString().split('T')[0],
};

const DEFAULT_FAVORITES: EngineeringModuleId[] = [
  'beam-analysis',
  'bearing-capacity',
  'concrete-mix',
  'rebar-bbs',
  'boq-estimator',
];

const DEFAULT_RECENT: EngineeringModuleId[] = [];

// ============================================================================
// CONTEXT CREATION & HOOK
// ============================================================================

const WorkbenchContext = createContext<WorkbenchContextType | undefined>(undefined);

export function useWorkbench(): WorkbenchContextType {
  const context = useContext(WorkbenchContext);
  if (!context) {
    throw new Error('useWorkbench must be used within a WorkbenchProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export interface WorkbenchProviderProps {
  children: React.ReactNode;
}

export const WorkbenchProvider: React.FC<WorkbenchProviderProps> = ({ children }) => {
  // Purge previously persisted user logs/history on version mismatch while retaining system settings
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const storedVer = localStorage.getItem(WORKBENCH_VERSION_KEY);
      if (storedVer !== CURRENT_WORKBENCH_VERSION) {
        console.info('[WorkbenchContext] Version mismatch detected. Purging previous user calculations/history while retaining system settings.');
        localStorage.removeItem('pb_civillab_calc_history_v1');
        localStorage.removeItem('pb_civillab_calc_history_v2');
        localStorage.removeItem('pb_civillab_recent_tools_v1');
        localStorage.removeItem(STORAGE_KEYS.CALC_HISTORY);

        // Retain system settings
        const oldUnitSystem = localStorage.getItem('pb_civillab_global_unit_system_v1');
        if (oldUnitSystem && !localStorage.getItem(STORAGE_KEYS.UNIT_SYSTEM)) {
          localStorage.setItem(STORAGE_KEYS.UNIT_SYSTEM, oldUnitSystem);
        }
        const oldFavorites = localStorage.getItem('pb_civillab_favorite_tools_v1');
        if (oldFavorites && !localStorage.getItem(STORAGE_KEYS.FAVORITE_TOOLS)) {
          localStorage.setItem(STORAGE_KEYS.FAVORITE_TOOLS, oldFavorites);
        }

        localStorage.setItem(WORKBENCH_VERSION_KEY, CURRENT_WORKBENCH_VERSION);
      }
    } catch (e) {
      console.warn('[WorkbenchContext] Purge error:', e);
    }
  }

  // 1. Global Unit System State
  const [unitSystem, setUnitSystemState] = useState<GlobalUnitSystem>(() => {
    if (typeof window === 'undefined') return 'SI';
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNIT_SYSTEM);
      if (saved === 'Imperial' || saved === 'SI' || saved === 'Regional') return saved;
    } catch {
      // Fallback
    }
    return 'SI';
  });

  const setUnitSystem = useCallback((newSystem: GlobalUnitSystem) => {
    setUnitSystemState(newSystem);
    try {
      localStorage.setItem(STORAGE_KEYS.UNIT_SYSTEM, newSystem);
    } catch {
      // Ignore
    }
  }, []);

  const toggleUnitSystem = useCallback(() => {
    setUnitSystemState((prev) => {
      const next: GlobalUnitSystem = prev === 'SI' ? 'Regional' : prev === 'Regional' ? 'Imperial' : 'SI';
      try {
        localStorage.setItem(STORAGE_KEYS.UNIT_SYSTEM, next);
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // 2. Project Metadata State
  const [projectMetadata, setProjectMetadata] = useState<ProjectMetadata>(() => {
    if (typeof window === 'undefined') return DEFAULT_METADATA;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECT_METADATA);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_METADATA, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_METADATA;
  });

  const updateProjectMetadata = useCallback((partial: Partial<ProjectMetadata>) => {
    setProjectMetadata((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEYS.PROJECT_METADATA, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const resetProjectMetadata = useCallback(() => {
    setProjectMetadata(DEFAULT_METADATA);
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT_METADATA, JSON.stringify(DEFAULT_METADATA));
    } catch {
      // Ignore
    }
  }, []);

  // 3. Recent Tools Tracking (last 6 unique tools)
  const [recentTools, setRecentTools] = useState<EngineeringModuleId[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_RECENT;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RECENT_TOOLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 6);
      }
    } catch {
      // Fallback
    }
    return DEFAULT_RECENT;
  });

  const recordToolUsage = useCallback((toolId: EngineeringModuleId) => {
    setRecentTools((prev) => {
      const filtered = prev.filter((id) => id !== toolId);
      const updated = [toolId, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(STORAGE_KEYS.RECENT_TOOLS, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  // 4. Favorite Tools Tracking
  const [favoriteTools, setFavoriteTools] = useState<EngineeringModuleId[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_FAVORITES;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITE_TOOLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return DEFAULT_FAVORITES;
  });

  const toggleFavoriteTool = useCallback((toolId: EngineeringModuleId) => {
    setFavoriteTools((prev) => {
      const isFav = prev.includes(toolId);
      const updated = isFav ? prev.filter((id) => id !== toolId) : [...prev, toolId];
      try {
        localStorage.setItem(STORAGE_KEYS.FAVORITE_TOOLS, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const isFavoriteTool = useCallback(
    (toolId: EngineeringModuleId) => favoriteTools.includes(toolId),
    [favoriteTools]
  );

  // 5. Calculation Snapshots History
  const [calculationHistory, setCalculationHistory] = useState<CalculationSnapshot[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CALC_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const saveCalculationSnapshot = useCallback(
    (snapshot: Omit<CalculationSnapshot, 'id' | 'timestamp'>): CalculationSnapshot => {
      const newRecord: CalculationSnapshot = {
        ...snapshot,
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
      };

      setCalculationHistory((prev) => {
        const updated = [newRecord, ...prev].slice(0, 50); // retain last 50 snapshots
        try {
          localStorage.setItem(STORAGE_KEYS.CALC_HISTORY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });

      return newRecord;
    },
    []
  );

  const deleteCalculationSnapshot = useCallback((id: string) => {
    setCalculationHistory((prev) => {
      const updated = prev.filter((record) => record.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.CALC_HISTORY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  }, []);

  const clearCalculationHistory = useCallback(() => {
    setCalculationHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.CALC_HISTORY);
    } catch {
      // Ignore
    }
  }, []);

  // 6. Unit Conversion Utilities
  const getUnitSymbol = useCallback(
    (category: EngineeringUnitCategory): string => {
      const descriptor = UNIT_REGISTRY[category];
      if (!descriptor) return '';
      return unitSystem === 'SI' ? descriptor.siSymbol : descriptor.imperialSymbol;
    },
    [unitSystem]
  );

  const getUnitName = useCallback(
    (category: EngineeringUnitCategory): string => {
      const descriptor = UNIT_REGISTRY[category];
      if (!descriptor) return '';
      return unitSystem === 'SI' ? descriptor.siName : descriptor.imperialName;
    },
    [unitSystem]
  );

  const convertValue = useCallback(
    (
      value: number,
      category: EngineeringUnitCategory,
      fromSystem: GlobalUnitSystem,
      toSystem: GlobalUnitSystem,
      decimals: number = 3
    ): number => {
      if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) return 0;
      if (fromSystem === toSystem) return roundEng(value, decimals);

      const descriptor = UNIT_REGISTRY[category];
      if (!descriptor) return roundEng(value, decimals);

      let converted: number;
      if (fromSystem === 'SI' && toSystem === 'Imperial') {
        converted = value * descriptor.siToImperialFactor;
      } else {
        converted = value / descriptor.siToImperialFactor;
      }

      return roundEng(converted, decimals);
    },
    []
  );

  const toActiveUnit = useCallback(
    (valueInSI: number, category: EngineeringUnitCategory, decimals: number = 3): number => {
      return convertValue(valueInSI, category, 'SI', unitSystem, decimals);
    },
    [convertValue, unitSystem]
  );

  const fromActiveUnitToSI = useCallback(
    (valueInActive: number, category: EngineeringUnitCategory, decimals: number = 3): number => {
      return convertValue(valueInActive, category, unitSystem, 'SI', decimals);
    },
    [convertValue, unitSystem]
  );

  const formatFeetInchesCallback = useCallback(
    (valueInFeetOrMeters: number, isMeters: boolean = false): string => {
      return formatFeetInches(valueInFeetOrMeters, { isMeters });
    },
    []
  );

  const formatWithActiveUnit = useCallback(
    (valueInSI: number, category: EngineeringUnitCategory, decimals: number = 2): string => {
      if (category === 'length' && (unitSystem === 'Imperial' || unitSystem === 'Regional')) {
        const converted = toActiveUnit(valueInSI, category, decimals);
        const symbol = getUnitSymbol(category);
        const ftIn = formatFeetInches(valueInSI, { isMeters: true });
        return `${converted.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals,
        })} ${symbol} (${ftIn})`;
      }
      const converted = toActiveUnit(valueInSI, category, decimals);
      const symbol = getUnitSymbol(category);
      return `${converted.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })} ${symbol}`;
    },
    [toActiveUnit, getUnitSymbol, unitSystem]
  );

  const value = useMemo<WorkbenchContextType>(
    () => ({
      unitSystem,
      setUnitSystem,
      toggleUnitSystem,
      getUnitSymbol,
      getUnitName,
      convertValue,
      toActiveUnit,
      fromActiveUnitToSI,
      formatWithActiveUnit,
      formatFeetInches: formatFeetInchesCallback,
      projectMetadata,
      updateProjectMetadata,
      resetProjectMetadata,
      recentTools,
      recordToolUsage,
      favoriteTools,
      toggleFavoriteTool,
      isFavoriteTool,
      calculationHistory,
      saveCalculationSnapshot,
      deleteCalculationSnapshot,
      clearCalculationHistory,
    }),
    [
      unitSystem,
      setUnitSystem,
      toggleUnitSystem,
      getUnitSymbol,
      getUnitName,
      convertValue,
      toActiveUnit,
      fromActiveUnitToSI,
      formatWithActiveUnit,
      formatFeetInchesCallback,
      projectMetadata,
      updateProjectMetadata,
      resetProjectMetadata,
      recentTools,
      recordToolUsage,
      favoriteTools,
      toggleFavoriteTool,
      isFavoriteTool,
      calculationHistory,
      saveCalculationSnapshot,
      deleteCalculationSnapshot,
      clearCalculationHistory,
    ]
  );

  return <WorkbenchContext.Provider value={value}>{children}</WorkbenchContext.Provider>;
};
