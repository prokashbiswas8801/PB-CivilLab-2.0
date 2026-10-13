export interface PrintSectionToggles {
  projectClientMetadata: boolean;
  projectDetailsLocation: boolean;
  userProfileAuthor: boolean;
  primaryResultBanner: boolean;
  calculationInputs: boolean;
  secondaryOutputs: boolean;
  detailedBreakdown: boolean;
  mathematicalEquations: boolean;
  assumptionsBasis: boolean;
  jobsiteNotes: boolean;
  qualitySignOff: boolean;
}

export type PaperSize = 'a4' | 'letter' | 'legal';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginOption = 'normal' | 'compact' | 'wide';
export type FontScaleOption = 'small' | 'medium' | 'large';

export interface PrintSettings {
  paperSize: PaperSize;
  orientation: PageOrientation;
  margins: MarginOption;
  fontScale: FontScaleOption;
  sections: PrintSectionToggles;
  includeQrCode: boolean;
  includeWatermark: boolean;
  watermarkText: string;
  customReportTitle?: string;
  customNotes?: string;
}

export interface PrintPreset {
  id: string;
  name: string;
  description: string;
  settings: PrintSettings;
  isBuiltIn?: boolean;
}

export const DEFAULT_SECTION_TOGGLES: PrintSectionToggles = {
  projectClientMetadata: true,
  projectDetailsLocation: true,
  userProfileAuthor: true,
  primaryResultBanner: true,
  calculationInputs: true,
  secondaryOutputs: true,
  detailedBreakdown: true,
  mathematicalEquations: true,
  assumptionsBasis: true,
  jobsiteNotes: true,
  qualitySignOff: true,
};

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  paperSize: 'a4',
  orientation: 'portrait',
  margins: 'normal',
  fontScale: 'medium',
  sections: DEFAULT_SECTION_TOGGLES,
  includeQrCode: true,
  includeWatermark: false,
  watermarkText: 'FOR ESTIMATION & ACADEMIC USE ONLY',
  customReportTitle: '',
  customNotes: '',
};

export const BUILT_IN_PRINT_PRESETS: PrintPreset[] = [
  {
    id: 'preset-client-standard',
    name: 'Standard Client Report',
    description: 'Complete formal submittal report with author credentials, equations, and quality sign-off.',
    isBuiltIn: true,
    settings: {
      ...DEFAULT_PRINT_SETTINGS,
      paperSize: 'a4',
      orientation: 'portrait',
      margins: 'normal',
      fontScale: 'medium',
      sections: {
        ...DEFAULT_SECTION_TOGGLES,
      },
    },
  },
  {
    id: 'preset-site-log',
    name: 'Internal Site Log & Work Order',
    description: 'Compact layout optimized for jobsite execution, foreman instructions, and material quantities.',
    isBuiltIn: true,
    settings: {
      ...DEFAULT_PRINT_SETTINGS,
      paperSize: 'a4',
      orientation: 'portrait',
      margins: 'compact',
      fontScale: 'small',
      sections: {
        projectClientMetadata: true,
        projectDetailsLocation: true,
        userProfileAuthor: false,
        primaryResultBanner: true,
        calculationInputs: true,
        secondaryOutputs: true,
        detailedBreakdown: true,
        mathematicalEquations: false,
        assumptionsBasis: false,
        jobsiteNotes: true,
        qualitySignOff: true,
      },
    },
  },
  {
    id: 'preset-executive-summary',
    name: 'Compact Executive Summary',
    description: '1-page high-level executive report highlighting key metrics, financial totals, and certification status.',
    isBuiltIn: true,
    settings: {
      ...DEFAULT_PRINT_SETTINGS,
      paperSize: 'a4',
      orientation: 'portrait',
      margins: 'compact',
      fontScale: 'small',
      sections: {
        projectClientMetadata: true,
        projectDetailsLocation: true,
        userProfileAuthor: true,
        primaryResultBanner: true,
        calculationInputs: true,
        secondaryOutputs: true,
        detailedBreakdown: false,
        mathematicalEquations: false,
        assumptionsBasis: false,
        jobsiteNotes: false,
        qualitySignOff: true,
      },
    },
  },
  {
    id: 'preset-structural-audit',
    name: 'Structural Permit & Code Audit',
    description: 'Exhaustive verification document including complete equations trace, safety factors, and BNBC standards.',
    isBuiltIn: true,
    settings: {
      ...DEFAULT_PRINT_SETTINGS,
      paperSize: 'a4',
      orientation: 'portrait',
      margins: 'wide',
      fontScale: 'medium',
      sections: {
        ...DEFAULT_SECTION_TOGGLES,
        mathematicalEquations: true,
        assumptionsBasis: true,
        jobsiteNotes: true,
        qualitySignOff: true,
      },
    },
  },
];

const PRINT_PRESETS_STORAGE_KEY = 'pb_civillab_print_presets';

export function loadSavedPrintPresets(): PrintPreset[] {
  try {
    const raw = localStorage.getItem(PRINT_PRESETS_STORAGE_KEY);
    if (!raw) return BUILT_IN_PRINT_PRESETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return BUILT_IN_PRINT_PRESETS;
    // Ensure built-in presets remain available
    const custom = parsed.filter((p) => !p.isBuiltIn);
    return [...BUILT_IN_PRINT_PRESETS, ...custom];
  } catch {
    return BUILT_IN_PRINT_PRESETS;
  }
}

export function savePrintPresets(presets: PrintPreset[]): void {
  try {
    localStorage.setItem(PRINT_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.error('Failed to save print presets to localStorage:', err);
  }
}
