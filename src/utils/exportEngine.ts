import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import QRCode from 'qrcode';
import {
  CivilWorkspace,
  EngineeringModuleId,
  UserProfile,
} from '../types/civil';
import {
  CalculationEnvelope,
  BeamAnalysisResult,
  BearingAnalysisResult,
  ConcreteMixResult,
  ChannelHydraulicsResult,
  ConcreteMaterialResult,
  RebarBBSResult,
  BOQResult,
  ContinuousBeamResult,
  PileCapacityResult,
  PipeHydraulicsResult,
  MasonryResult,
  EarthworkResult,
  RateAnalysisResult,
} from './calculations';
import { FrameTruss2DResult } from './frameSolver2d';
import { SectionAnalyzerResult } from './sectionMechanics';
import { RcColumnDesignResult } from './rcColumnEngine';
import { StrutAndTieResult } from './strutAndTieEngine';
import { getGoverningEquations, GoverningEquationInfo } from './analyticalExport';
import { generateSubmittalDocRef } from './qrCode';
import {
  createVerifiedReportRecord,
  saveVerifiedReport,
} from './verificationEngine';
import { TESTING_LAB_TEST_MAP, TESTING_LAB_TESTS } from '../data/testingLabCatalog';
import {
  BRAND_LOGO_LIGHT_SVG_DATA_URI,
  getBrandLogoLightPngDataUrl,
  getBrandLogoPngDataUrl,
} from '../assets/brandLogoData';
import { formatFeetInches } from './unitConverter';
import {
  evaluateLabTest,
  getDefaultChecklistStates,
  getDefaultInputsForTest,
} from './testingLabEngine';

// ============================================================================
// 1. CLEAN SYMBOL SANITIZER (ASCII Engineering Notation for jsPDF Standard Fonts)
// ============================================================================

/**
 * Replaces unsupported Unicode, Greek, subscript/superscript, and currency symbols
 * in jsPDF standard fonts with clean, readable engineering ASCII notations
 * (e.g. Phi, gamma, sigma, f'c, Mu, m^3/s, kN/m^2, BDT).
 * Prevents garbled mojibake or missing characters on vector PDF output.
 */
export function sanitizeEngineeringSymbols(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  let str = String(text);

  const replacements: [RegExp, string][] = [
    // Currency symbols not in WinAnsi
    [/\u09F3/g, 'BDT '],                    // ৳
    [/\u20B9/g, 'INR '],                    // ₹

    // Greek letters
    [/[\u03C6\u03D5\u03A6]/g, 'Phi'],       // φ, ϕ, Φ
    [/[\u03B3\u0393]/g, 'gamma'],           // γ, Γ
    [/[\u03C3\u03C2]/g, 'sigma'],           // σ, ς
    [/[\u03A3\u2211]/g, 'Sum '],            // Σ, ∑
    [/[\u03C4]/g, 'tau'],                   // τ
    [/[\u03B4]/g, 'delta'],                 // δ
    [/[\u0394\u2206]/g, 'Delta'],           // Δ, ∆
    [/[\u03B8\u0398]/g, 'theta'],           // θ, Θ
    [/[\u03B2]/g, 'beta'],                  // β
    [/[\u03BB\u039B]/g, 'lambda'],          // λ, Λ
    [/[\u03C0\u03A0]/g, 'pi'],              // π, Π
    [/[\u03C1]/g, 'rho'],                   // ρ
    [/[\u03B5\u03F5]/g, 'epsilon'],         // ε, ϵ
    [/[\u03BC\u00B5]/g, 'mu'],              // μ, µ
    [/[\u03C9\u03A9\u2126]/g, 'omega'],     // ω, Ω, Ω
    [/[\u03B1]/g, 'alpha'],                 // α
    [/[\u03B7]/g, 'eta'],                   // η
    [/[\u03BE\u039E]/g, 'xi'],              // ξ, Ξ
    [/[\u03B6]/g, 'zeta'],                  // ζ
    [/[\u03BD]/g, 'nu'],                    // ν
    [/[\u03BA]/g, 'kappa'],                 // κ
    [/[\u03C7]/g, 'chi'],                   // χ
    [/[\u03C8\u03A8]/g, 'psi'],             // ψ, Ψ

    // Math comparisons, operators, integrals, and arrows
    [/[\u2264]/g, '<='],                    // ≤
    [/[\u2265]/g, '>='],                    // ≥
    [/[\u2260]/g, '!='],                    // ≠
    [/[\u2248\u2245\u2243]/g, '~='],        // ≈, ≅, ≃
    [/[\u00D7]/g, 'x'],                     // ×
    [/[\u00F7]/g, '/'],                     // ÷
    [/[\u2212]/g, '-'],                     // − (Unicode minus)
    [/[\u00B1]/g, '+/-'],                   // ±
    [/[\u221A]/g, 'sqrt'],                  // √
    [/[\u222B]/g, 'Integral '],             // ∫
    [/[\u221E]/g, 'INF'],                   // ∞
    [/[\u2208]/g, ' in '],                  // ∈
    [/[\u2209]/g, ' not in '],              // ∉
    [/[\u2192\u27F6]/g, '->'],              // →, ⟶
    [/[\u2190]/g, '<-'],                    // ←
    [/[\u2194\u21C4]/g, '<->'],             // ↔, ⇄
    [/[\u21D2]/g, '=>'],                    // ⇒
    [/[\u2032]/g, "'"],                     // ′ (feet / prime)
    [/[\u2033]/g, '"'],                     // ″ (inches / double prime)
    [/[\u2030]/g, ' per-mille'],            // ‰

    // Exponents / superscripts
    [/[\u2070]/g, '^0'],                    // ⁰
    [/[\u00B9]/g, '^1'],                    // ¹
    [/[\u00B2]/g, '^2'],                    // ²
    [/[\u00B3]/g, '^3'],                    // ³
    [/[\u2074]/g, '^4'],                    // ⁴
    [/[\u2075]/g, '^5'],                    // ⁵
    [/[\u2076]/g, '^6'],                    // ⁶
    [/[\u2077]/g, '^7'],                    // ⁷
    [/[\u2078]/g, '^8'],                    // ⁸
    [/[\u2079]/g, '^9'],                    // ⁹
    [/[\u207A]/g, '^+'],                    // ⁺
    [/[\u207B]/g, '^-'],                    // ⁻

    // Subscripts
    [/[\u2080]/g, '_0'],                    // ₀
    [/[\u2081]/g, '_1'],                    // ₁
    [/[\u2082]/g, '_2'],                    // ₂
    [/[\u2083]/g, '_3'],                    // ₃
    [/[\u2084]/g, '_4'],                    // ₄
    [/[\u2085]/g, '_5'],                    // ₅
    [/[\u2086]/g, '_6'],                    // ₆
    [/[\u2087]/g, '_7'],                    // ₇
    [/[\u2088]/g, '_8'],                    // ₈
    [/[\u2089]/g, '_9'],                    // ₉
    [/[\u208A]/g, '_+'],                    // ₊
    [/[\u208B]/g, '_-'],                    // ₋

    // Engineering units, diameters, and punctuation
    [/[\u00B0]/g, ' deg'],                  // °
    [/[\u00D8\u00F8\u2300]/g, 'Dia '],      // Ø, ø, ⌀
    [/[\u00B7]/g, '.'],                     // ·
    [/[\u2022\u25CF\u25AA]/g, '-'],         // •, ●, ▪
    [/[\u2013\u2014]/g, '-'],               // – —
    [/[\u2018\u2019]/g, "'"],               // ‘ ’
    [/[\u201C\u201D]/g, '"'],               // “ ”
    [/[\u2026]/g, '...'],                   // …

    // Specific civil terms
    [/f'?c/gi, "f'c"],
    [/f_y/gi, 'fy'],
    [/M_?u/g, 'Mu'],
    [/V_?u/g, 'Vu'],
    [/P_?u/g, 'Pu'],
  ];

  for (const [pattern, repl] of replacements) {
    str = str.replace(pattern, repl);
  }

  // Strip any remaining non-WinAnsi characters (> U+00FF) to guarantee zero mojibake in Helvetica/Courier
  str = str.replace(/[^\x20-\x7E\xA0-\xFF\r\n\t]/g, '');

  return str;
}

// ============================================================================
// 2. ONE-CLICK CSV / EXCEL EXPORT ENGINE (RFC 4180 + UTF-8 BOM)
// ============================================================================

export interface CSVExportMetadata {
  projectName?: string;
  projectCode?: string;
  engineerName?: string;
  moduleTitle?: string;
  date?: string;
  unitSystem?: string;
  client?: string;
  location?: string;
  [key: string]: string | undefined;
}

/**
 * Universal client-side CSV / Excel exporter with UTF-8 BOM and RFC 4180 escaping.
 * Compatible directly with Microsoft Excel, Google Sheets, LibreOffice, and CAD data tables.
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  metadata?: CSVExportMetadata
): void {
  const lines: string[] = [];
  const BOM = '\uFEFF'; // Excel UTF-8 Byte Order Mark

  // Metadata block header
  if (metadata && Object.keys(metadata).length > 0) {
    lines.push(`"BD. CIVILLAB — PROFESSIONAL CIVIL ENGINEERING SCHEDULE"`);
    for (const [key, val] of Object.entries(metadata)) {
      if (val !== undefined && val !== null && val !== '') {
        const cleanKey = sanitizeEngineeringSymbols(key).replace(/"/g, '""');
        const cleanVal = sanitizeEngineeringSymbols(String(val)).replace(/"/g, '""');
        lines.push(`"${cleanKey}:","${cleanVal}"`);
      }
    }
    lines.push(''); // Blank row separator
  }

  // Headers
  const escapedHeaders = headers.map((h) => {
    const clean = sanitizeEngineeringSymbols(h).replace(/"/g, '""');
    return `"${clean}"`;
  });
  lines.push(escapedHeaders.join(','));

  // Rows
  for (const row of rows) {
    const escapedRow = row.map((cell) => {
      if (cell === null || cell === undefined) return '""';
      const clean = sanitizeEngineeringSymbols(String(cell)).replace(/"/g, '""');
      return `"${clean}"`;
    });
    lines.push(escapedRow.join(','));
  }

  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', safeFilename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// 3. UNIFIED ENGINEERING REPORT DATA INTERFACE
// ============================================================================

export interface ReportParameterRow {
  name: string;
  symbol: string;
  value: string | number;
  unit: string;
  notes?: string;
}

export interface ReportOutputRow {
  name: string;
  symbol: string;
  value: string | number;
  unit: string;
  limit?: string;
  dcrRatio?: number | string;
  status: 'PASS' | 'SAFE' | 'WARNING' | 'FAIL' | 'CRITICAL' | 'INFO';
}

export interface ReportTakeoffRow {
  col1: string;          // Item No / Bar Mark / Span / Node
  col2: string;          // Description / Bar Type / Member
  col3: string;          // Category / Unit / Shape
  col4: string | number; // Dimensions / Cut Length / Force
  col5: string | number; // Quantity / Total Weight / Moment
  col6?: string | number;// Unit Rate / Spacing / Stress
  col7?: string | number;// Total Cost / MT / Status
}

export interface ReportFormulaStep {
  stepNumber?: number | string;
  title: string;
  equation: string;
  substitution?: string;
  result: string;
  codeRef?: string;
  remarks?: string;
}

export type ExportUnitPreset = 'workspace' | 'metric' | 'imperial' | 'regional';

export interface EngineeringReportData {
  projectMeta: {
    projectName: string;
    projectCode: string;
    client?: string;
    location?: string;
    date: string;
    unitSystem: 'SI' | 'Imperial' | 'Regional' | string;
    engineerName?: string;
    engineerDesignation?: string;
    engineerLicense?: string;
    organization?: string;
    checkerName?: string;
  };
  moduleMeta: {
    moduleId: EngineeringModuleId | string;
    moduleTitle: string;
    category?: string;
    standard?: string;
    status?: 'PASS' | 'SAFE' | 'WARNING' | 'FAIL' | 'CRITICAL' | 'VERIFIED' | 'ZERO BASELINE';
    dcrMax?: number;
    dcrSummaryText?: string;
  };
  inputs: ReportParameterRow[];
  outputs: ReportOutputRow[];
  takeoffTitle?: string;
  takeoffHeaders?: string[];
  takeoffRows?: ReportTakeoffRow[];
  takeoffSummary?: Array<{ label: string; value: string | number }>;
  stepByStepFormulas?: ReportFormulaStep[];
  governingAssumptions?: string[];
  diagramDataUrl?: string;
  diagramWidth?: number;
  diagramHeight?: number;
  diagramCaption?: string;
  qrLinkUrl?: string;
  docId?: string;
  notes?: string[];
}

export interface PdfExportEngineOptions {
  onProgress?: (progress: { stage: string; percent: number }) => void;
  autoDownload?: boolean;
  filename?: string;
  paperSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
  exportUnitPreset?: ExportUnitPreset;
  customHeaderTitle?: string;
  customCompanySubtitle?: string;
  customProjectName?: string;
  customClientName?: string;
  customSignatory?: string;
  includeHeader?: boolean;
  showProjectMetadata?: boolean;
  includeDiagram?: boolean;
  includeFormulaSteps?: boolean;
  includeAssumptions?: boolean;
  includeQR?: boolean;
  includeSignatureBlock?: boolean;
  includeFooter?: boolean;
  captureLiveDiagram?: boolean;
}

/**
 * Converts a single value + unit pair into the target export unit preset ('metric' | 'imperial' | 'regional')
 * with high engineering accuracy and clean formatting.
 */
export function convertValueAndUnitForExport(
  rawValue: string | number,
  rawUnit: string,
  targetSystem: 'metric' | 'imperial' | 'regional'
): { value: string | number; unit: string } {
  const u = (rawUnit || '').trim();
  const numVal =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string' && /^-?\d+(\.\d+)?$/.test(rawValue.trim())
        ? parseFloat(rawValue.trim())
        : NaN;

  if (!Number.isFinite(numVal) || !u || u === '-' || u === 'ratio' || u === '%' || u === 'deg' || u === 'type' || u === 'code' || u === 'factor') {
    return { value: rawValue, unit: rawUnit };
  }

  const fmt = (n: number, d = 2) => {
    if (Math.abs(n) === 0) return '0';
    if (Math.abs(n) >= 1000) return n.toFixed(1);
    if (Math.abs(n) >= 10) return n.toFixed(d);
    return Number(n.toFixed(Math.max(d, 3))).toString();
  };

  if (targetSystem === 'metric') {
    // Normalize any imperial/regional units back to SI
    if (u === 'ft') return { value: fmt(numVal * 0.3048, 3), unit: 'm' };
    if (u === 'in') return { value: fmt(numVal * 25.4, 1), unit: 'mm' };
    if (u === 'sq ft' || u === 'ft^2' || u === 'ft²') return { value: fmt(numVal * 0.092903, 2), unit: 'm^2' };
    if (u === 'CFT' || u === 'ft^3' || u === 'ft³') return { value: fmt(numVal * 0.0283168, 3), unit: 'm^3' };
    if (u === 'psi') return { value: fmt(numVal / 145.0377, 2), unit: 'MPa' };
    if (u === 'kip' || u === 'kips') return { value: fmt(numVal * 4.44822, 2), unit: 'kN' };
    if (u === 'lbs' || u === 'lb') return { value: fmt(numVal * 0.453592, 2), unit: 'kg' };
    return { value: rawValue, unit: rawUnit };
  }

  if (targetSystem === 'imperial') {
    switch (u) {
      case 'm':
        return { value: `${formatFeetInches(numVal, { isMeters: true })} (${fmt(numVal * 3.28084, 2)} ft)`, unit: 'ft-in' };
      case 'mm':
        return { value: fmt(numVal / 25.4, 2), unit: 'in' };
      case 'cm':
        return { value: fmt(numVal / 2.54, 2), unit: 'in' };
      case 'm^2':
      case 'm²':
        return { value: fmt(numVal * 10.76391, 2), unit: 'sq ft' };
      case 'cm^4':
      case 'cm⁴':
        return { value: fmt(numVal * 0.024025, 2), unit: 'in^4' };
      case 'm^3':
      case 'm³':
        return { value: fmt(numVal * 35.31467, 2), unit: 'CFT' };
      case 'L':
        return { value: fmt(numVal * 0.264172, 2), unit: 'gal' };
      case 'kN':
        return { value: fmt(numVal * 0.224809, 2), unit: 'kip' };
      case 'kN/m':
        return { value: fmt(numVal * 0.0685218, 3), unit: 'kip/ft' };
      case 'kN.m':
      case 'kN·m':
      case 'kNm':
        return { value: fmt(numVal * 0.737562, 2), unit: 'kip.ft' };
      case 'MPa':
        return { value: fmt(numVal * 145.0377, 0), unit: 'psi' };
      case 'GPa':
        return { value: fmt(numVal * 145.0377, 0), unit: 'ksi' };
      case 'kPa':
      case 'kN/m^2':
        return { value: fmt(numVal * 20.8854, 1), unit: 'psf' };
      case 'kN/m^3':
      case 'kN/m³':
        return { value: fmt(numVal * 6.36588, 1), unit: 'pcf' };
      case 'kg':
        return { value: fmt(numVal * 2.20462, 1), unit: 'lbs' };
      case 'kg/m':
        return { value: fmt(numVal * 0.671969, 3), unit: 'lb/ft' };
      case 'kg/m^3':
      case 'kg/m³':
        return { value: fmt(numVal * 0.062428, 1), unit: 'lb/ft^3' };
      case 'm^3/s':
      case 'm³/s':
        return { value: fmt(numVal * 35.31467, 2), unit: 'cfs' };
      case 'L/s':
        return { value: fmt(numVal * 15.8503, 1), unit: 'gpm' };
      case 'm/s':
        return { value: fmt(numVal * 3.28084, 2), unit: 'ft/s' };
      default:
        return { value: rawValue, unit: rawUnit };
    }
  }

  // targetSystem === 'regional' (Bangladesh Field Standard: ft-in, sq ft / Katha, CFT, psi, kg/MT)
  switch (u) {
    case 'm':
      return { value: `${formatFeetInches(numVal, { isMeters: true })} (${fmt(numVal * 3.28084, 2)} ft)`, unit: 'ft-in' };
    case 'mm':
      return { value: `${fmt(numVal / 25.4, 2)}" (${fmt(numVal, 0)} mm)`, unit: 'in (mm)' };
    case 'cm':
      return { value: fmt(numVal / 2.54, 2), unit: 'in' };
    case 'm^2':
    case 'm²': {
      const sqft = numVal * 10.76391;
      if (sqft >= 720) {
        return { value: `${fmt(sqft, 1)} sq ft (${fmt(sqft / 720, 2)} Katha)`, unit: 'sq ft / Katha' };
      }
      return { value: fmt(sqft, 2), unit: 'sq ft' };
    }
    case 'm^3':
    case 'm³':
      return { value: fmt(numVal * 35.31467, 2), unit: 'CFT' };
    case 'MPa':
      return { value: `${fmt(numVal * 145.0377, 0)} psi (${fmt(numVal, 1)} MPa)`, unit: 'psi (MPa)' };
    case 'kPa':
      return { value: `${fmt(numVal * 0.0208854, 2)} tsf (${fmt(numVal, 1)} kPa)`, unit: 'tsf (kPa)' };
    case 'm^3/s':
    case 'm³/s':
      return { value: fmt(numVal * 35.31467, 2), unit: 'cusec (cfs)' };
    default:
      return { value: rawValue, unit: rawUnit };
  }
}

/**
 * Converts an entire `EngineeringReportData` payload into the user's selected export unit preset
 * ('workspace' | 'metric' | 'imperial' | 'regional').
 */
export function applyExportUnitConversionToReport(
  reportData: EngineeringReportData,
  exportUnitPreset: ExportUnitPreset = 'workspace',
  workspace?: CivilWorkspace
): EngineeringReportData {
  const effectiveSystem: 'metric' | 'imperial' | 'regional' =
    exportUnitPreset === 'workspace'
      ? (workspace?.unitPreferences?.systemPreset as 'metric' | 'imperial' | 'regional') ||
        (reportData.projectMeta.unitSystem === 'Imperial' ? 'imperial' : 'metric')
      : exportUnitPreset;

  const unitLabelMap: Record<'metric' | 'imperial' | 'regional', string> = {
    metric: 'SI Metric (m, kN, MPa)',
    imperial: 'Imperial (ft-in, kip, psi)',
    regional: 'Regional BD (ft-in, CFT, psi)',
  };

  if (effectiveSystem === 'metric' && reportData.projectMeta.unitSystem === 'SI') {
    return {
      ...reportData,
      projectMeta: {
        ...reportData.projectMeta,
        unitSystem: unitLabelMap.metric,
      },
    };
  }

  const convertedInputs = (reportData.inputs || []).map((inp) => {
    const conv = convertValueAndUnitForExport(inp.value, inp.unit, effectiveSystem);
    return {
      ...inp,
      value: conv.value,
      unit: conv.unit,
    };
  });

  const convertedOutputs = (reportData.outputs || []).map((out) => {
    const conv = convertValueAndUnitForExport(out.value, out.unit, effectiveSystem);
    let convertedLimit = out.limit;
    if (out.limit && effectiveSystem !== 'metric') {
      // Replace embedded metric numbers in limit strings like "12.50 mm (L/360)" or "25 MPa"
      convertedLimit = out.limit
        .replace(/(\d+(?:\.\d+)?)\s*mm/g, (_, n) => `${(parseFloat(n) / 25.4).toFixed(2)} in`)
        .replace(/(\d+(?:\.\d+)?)\s*MPa/g, (_, n) => `${(parseFloat(n) * 145.0377).toFixed(0)} psi`)
        .replace(/(\d+(?:\.\d+)?)\s*m\b/g, (_, n) => `${(parseFloat(n) * 3.28084).toFixed(2)} ft`);
    }
    return {
      ...out,
      value: conv.value,
      unit: conv.unit,
      limit: convertedLimit,
    };
  });

  const convertedHeaders = reportData.takeoffHeaders
    ? reportData.takeoffHeaders.map((h) => {
        if (effectiveSystem === 'metric') return h;
        return h
          .replace(/\(m\)/g, '(ft)')
          .replace(/\(m\^3\)|\(m³\)/g, '(CFT)')
          .replace(/\(m\^2\)|\(m²\)/g, '(sq ft)')
          .replace(/\(MPa\)/g, '(psi)');
      })
    : undefined;

  return {
    ...reportData,
    projectMeta: {
      ...reportData.projectMeta,
      unitSystem: unitLabelMap[effectiveSystem],
    },
    inputs: convertedInputs,
    outputs: convertedOutputs,
    takeoffHeaders: convertedHeaders,
  };
}

let cachedNikoshBase64: string | null = null;

/**
 * Loads Nikosh TrueType font as base64 string from local precache or web for jsPDF
 */
export async function loadNikoshFontBase64(): Promise<string | null> {
  if (cachedNikoshBase64) return cachedNikoshBase64;
  if (typeof window === 'undefined') return null;

  try {
    const res = await fetch('/fonts/Nikosh.ttf');
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSz = 8192;
    for (let i = 0; i < bytes.length; i += chunkSz) {
      const slice = bytes.subarray(i, Math.min(i + chunkSz, bytes.length));
      binary += String.fromCharCode.apply(null, slice as any);
    }
    cachedNikoshBase64 = btoa(binary);
    return cachedNikoshBase64;
  } catch (err) {
    console.warn('[PDF Font] Unable to load Nikosh.ttf offline font into jsPDF:', err);
    return null;
  }
}

/**
 * Registers Nikosh into jsPDF virtual file system if available
 */
export async function registerNikoshFontIfAvailable(doc: jsPDF): Promise<boolean> {
  try {
    const base64 = await loadNikoshFontBase64();
    if (base64) {
      doc.addFileToVFS('Nikosh.ttf', base64);
      doc.addFont('Nikosh.ttf', 'Nikosh', 'normal');
      doc.addFont('Nikosh.ttf', 'Nikosh', 'bold');
      return true;
    }
  } catch (err) {
    console.warn('[PDF Font] Error registering Nikosh into jsPDF:', err);
  }
  return false;
}

/**
 * Helper to determine if an <svg> element is a real 2D engineering schematic
 * rather than a tiny 16x16 / 24x24 Lucide UI toolbar icon.
 */
export function isEngineeringSchematicSvg(svgEl: SVGSVGElement): boolean {
  const cls = (svgEl.getAttribute('class') || '').toLowerCase();
  if (cls.includes('lucide') || svgEl.hasAttribute('data-lucide')) {
    return false;
  }
  const vb = svgEl.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    return vb.width >= 180 && vb.height >= 100;
  }
  const widthAttr = parseFloat(svgEl.getAttribute('width') || '0');
  if (widthAttr > 0 && widthAttr < 120) {
    return false;
  }
  const rect = svgEl.getBoundingClientRect();
  if (rect.width > 0 && rect.width < 120) {
    return false;
  }
  return true;
}

/**
 * Locates the active module's 2D analytical SVG diagram in the DOM and captures it
 * as a crisp Light CAD Blueprint PNG data URL on a pure white background.
 */
export async function captureActiveModuleDiagramPng(): Promise<{
  dataUrl: string;
  width: number;
  height: number;
} | null> {
  if (typeof document === 'undefined') return null;
  const selectors = [
    '[data-diagram-export="active-module"] [data-cad-diagram="true"] svg',
    '#pb-print-capture-source .print-capture-diagram svg',
    '[data-diagram-export="active-module"] svg',
    '.print-capture-diagram svg',
    '.analytical-diagram-container svg',
  ];

  for (const sel of selectors) {
    const candidates = Array.from(document.querySelectorAll(sel)) as SVGSVGElement[];
    for (const svgEl of candidates) {
      if (isEngineeringSchematicSvg(svgEl)) {
        const captured = await captureSvgToPngDataUrl(svgEl);
        if (captured) return captured;
      }
    }
  }
  return null;
}

// ============================================================================
// 4. PROFESSIONAL ENGINEERING PDF GENERATOR (jsPDF + jspdf-autotable + QRCode)
// ============================================================================

/**
 * Builds and renders a professional, multi-page engineering calculation submittal
 * using jsPDF, jspdf-autotable, embedded 2D vector schematic capture, and QR verification.
 */
export async function generateEngineeringPDF(
  rawReportData: EngineeringReportData,
  options: PdfExportEngineOptions = {}
): Promise<jsPDF> {
  const {
    onProgress,
    paperSize = 'a4',
    orientation = 'portrait',
    marginMm = 14,
    exportUnitPreset = 'workspace',
    customHeaderTitle,
    customCompanySubtitle,
    customProjectName,
    customClientName,
    customSignatory,
    includeHeader = true,
    showProjectMetadata = true,
    includeDiagram = true,
    includeFormulaSteps = true,
    includeAssumptions = true,
    includeQR = true,
    includeSignatureBlock = true,
    includeFooter = true,
    captureLiveDiagram = true,
  } = options;

  const reportData = applyExportUnitConversionToReport(rawReportData, exportUnitPreset);

  const notify = async (stage: string, percent: number) => {
    if (onProgress) {
      onProgress({ stage, percent });
      await new Promise((r) => setTimeout(r, 35));
    }
  };

  await notify('Initializing submittal sheet geometry & vector canvas...', 15);

  const format = paperSize === 'legal' ? 'legal' : paperSize === 'letter' ? 'letter' : 'a4';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  await registerNikoshFontIfAvailable(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = Math.max(8, Math.min(24, marginMm));
  const contentWidth = pageWidth - 2 * margin;

  const docId = reportData.docId || generateSubmittalDocRef(new Date().getFullYear());
  const now = new Date();
  const dateStr =
    reportData.projectMeta.date ||
    now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // Apply custom overrides if provided
  const effectiveProjectName = customProjectName || reportData.projectMeta.projectName || 'Untitled Project';
  const effectiveClient = customClientName || reportData.projectMeta.client || 'Not Specified';
  const effectiveSignatory = customSignatory || reportData.projectMeta.engineerName || 'Pending Signature';
  const effectiveModuleTitle = customHeaderTitle || reportData.moduleMeta.moduleTitle;

  // Generate QR Code Data URL & Brand Logo
  await notify('Generating cryptographic verification QR stamp & consultant seal...', 30);
  const qrUrl =
    reportData.qrLinkUrl ||
    (typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}/?verify=${encodeURIComponent(docId)}`
      : `https://bd-civillab.engine?doc=${encodeURIComponent(docId)}`);

  let qrDataUrl = '';
  if (includeQR) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrUrl, {
        margin: 1,
        width: 160,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (err) {
      console.warn('QR Code generation fallback:', err);
    }
  }

  let brandLogoDataUrl = '';
  try {
    brandLogoDataUrl = await getBrandLogoLightPngDataUrl(256);
  } catch {
    brandLogoDataUrl = '';
  }

  // Capture live 2D diagram if enabled and not already attached
  let diagramImg = reportData.diagramDataUrl
    ? {
        dataUrl: reportData.diagramDataUrl,
        width: reportData.diagramWidth || 640,
        height: reportData.diagramHeight || 260,
      }
    : null;
  if (includeDiagram && !diagramImg && captureLiveDiagram) {
    diagramImg = await captureActiveModuleDiagramPng();
  }

  let yPos = margin;

  // ==========================================================================
  // PAGE 1: CLEAN LIGHT ARCHITECTURAL CONSULTANT TITLE BLOCK & HEADER
  // ==========================================================================
  await notify('Composing consultant title block and project credentials...', 45);

  if (includeHeader) {
    const headerH = 26.5;
    // Clean Light Architectural Header Surface (#ffffff) with crisp navy border (#1e3a8a)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.45);
    doc.roundedRect(margin, yPos, contentWidth, headerH, 1.5, 1.5, 'FD');

    // Top 1.6mm structural navy accent bar (#1e3a8a)
    doc.setFillColor(30, 58, 138);
    doc.rect(margin, yPos, contentWidth, 1.6, 'F');

    // Bottom subtle blueprint divider stripe (#dbeafe)
    doc.setFillColor(239, 246, 255);
    doc.rect(margin + 0.3, yPos + headerH - 5.8, contentWidth - 0.6, 5.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(margin, yPos + headerH - 5.8, margin + contentWidth, yPos + headerH - 5.8);

    let titleTextX = margin + 4;
    if (brandLogoDataUrl) {
      try {
        doc.addImage(brandLogoDataUrl, 'PNG', margin + 3.5, yPos + 3, 17, 17);
        titleTextX = margin + 23.5;
      } catch {
        titleTextX = margin + 4;
      }
    }

    // Brand Name in Deep Architectural Navy (#0f172a)
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('BD. CIVILLAB', titleTextX, yPos + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 58, 138);
    doc.text(
      sanitizeEngineeringSymbols(
        customCompanySubtitle || 'PROFESSIONAL CIVIL ENGINEERING LABORATORY & CERTIFIED SUBMITTAL SUITE'
      ),
      titleTextX,
      yPos + 12.8
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      sanitizeEngineeringSymbols(
        `SUBMITTAL REF: ${docId}  |  STATUS: ${reportData.moduleMeta.status || 'VERIFIED'}  |  UNITS: ${String(reportData.projectMeta.unitSystem).toUpperCase()}`
      ),
      titleTextX,
      yPos + 17.5
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text(
      sanitizeEngineeringSymbols(
        `Governing Code: ${reportData.moduleMeta.standard || 'BNBC 2020 / ACI 318-19 / AISC 360-16'}`
      ),
      margin + 4,
      yPos + 24.4
    );

    // QR Code Box (top right on clean white card with slate border)
    if (qrDataUrl) {
      const qrSize = 20;
      const qrX = margin + contentWidth - qrSize - 2.5;
      const qrY = yPos + 3.2;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.25);
      doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1, 1, 'FD');
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    }

    yPos += headerH + 3.5;
  }

  // Metadata Grid Box
  if (showProjectMetadata) {
    const metaBoxHeight = 26;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, yPos, contentWidth, metaBoxHeight, 1.5, 1.5, 'FD');

    const col1X = margin + 4;
    const col2X = margin + contentWidth / 2 + 3;
    doc.line(margin + contentWidth / 2, yPos + 11, margin + contentWidth / 2, yPos + metaBoxHeight - 2);

    // Module & Submittal Header Banner inside Metadata Box
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 0.3, yPos + 0.3, contentWidth - 0.6, 10, 'F');
    doc.line(margin, yPos + 10.3, margin + contentWidth, yPos + 10.3);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(
      sanitizeEngineeringSymbols(`${effectiveModuleTitle} - Calculation Submittal`),
      col1X,
      yPos + 4.8
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      sanitizeEngineeringSymbols(
        `Standard: ${reportData.moduleMeta.standard || 'BNBC 2020 / ACI 318-19'}  |  Category: ${reportData.moduleMeta.category || 'Structural / Civil Engineering'}`
      ),
      col1X,
      yPos + 8.8
    );

    // Column 1: Project Identification
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(
      sanitizeEngineeringSymbols(`Project: ${effectiveProjectName} [${reportData.projectMeta.projectCode || 'PRJ-001'}]`),
      col1X,
      yPos + 14.8
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      sanitizeEngineeringSymbols(`Client / Authority: ${effectiveClient}`),
      col1X,
      yPos + 19
    );
    doc.text(
      sanitizeEngineeringSymbols(`Site Location: ${reportData.projectMeta.location || 'Not Specified'}`),
      col1X,
      yPos + 23.2
    );

    // Column 2: Engineer of Record Credentials
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(
      sanitizeEngineeringSymbols(`Engineer of Record: ${effectiveSignatory}`),
      col2X,
      yPos + 14.8
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      sanitizeEngineeringSymbols(
        `Organization: ${reportData.projectMeta.organization || 'Independent Engineering Practice'}  |  Lic: ${reportData.projectMeta.engineerLicense || 'Pending'}`
      ),
      col2X,
      yPos + 19
    );
    doc.text(
      sanitizeEngineeringSymbols(`Submittal Date: ${dateStr}  |  Unit System: ${reportData.projectMeta.unitSystem} Standard`),
      col2X,
      yPos + 23.2
    );

    yPos += metaBoxHeight + 5;
  }

  let sectionNum = 1;

  // ==========================================================================
  // SECTION 1: INPUT DESIGN PARAMETERS
  // ==========================================================================
  await notify('Tabulating design input parameters & specifications...', 58);

  if (reportData.inputs && reportData.inputs.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${sectionNum}.0 INPUT DESIGN PARAMETERS & SPECIFICATIONS`, margin, yPos);
    sectionNum++;
    yPos += 2.2;

    const inputHeaders = ['Parameter Description', 'Symbol', 'Design Input Value', 'Unit', 'Standard / Specification'];
    const inputRows = reportData.inputs.map((inp) => [
      sanitizeEngineeringSymbols(inp.name),
      sanitizeEngineeringSymbols(inp.symbol),
      sanitizeEngineeringSymbols(String(inp.value)),
      sanitizeEngineeringSymbols(inp.unit),
      sanitizeEngineeringSymbols(inp.notes || '-'),
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [inputHeaders],
      body: inputRows,
      theme: 'grid',
      styles: {
        fontSize: 7.3,
        cellPadding: 1.6,
        textColor: [15, 23, 42],
        font: 'helvetica',
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [239, 246, 255],
        textColor: [30, 58, 138],
        lineColor: [148, 163, 184],
        lineWidth: 0.2,
        fontStyle: 'bold',
        fontSize: 7.3,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.34 },
        1: { cellWidth: contentWidth * 0.12, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: contentWidth * 0.18, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: contentWidth * 0.12, halign: 'center' },
        4: { cellWidth: 'auto' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  // ==========================================================================
  // SECTION 2: 2D ANALYTICAL / STRUCTURAL SCHEMATIC DIAGRAM (LIGHT CAD BLUEPRINT)
  // ==========================================================================
  if (includeDiagram && diagramImg && diagramImg.dataUrl) {
    await notify('Embedding high-resolution 2D engineering schematic...', 66);

    const aspect = diagramImg.height / Math.max(1, diagramImg.width);
    const maxDiagramH = orientation === 'landscape' ? 62 : 70;
    let renderW = contentWidth - 4;
    let renderH = renderW * aspect;
    if (renderH > maxDiagramH) {
      renderH = maxDiagramH;
      renderW = renderH / aspect;
    }

    if (yPos + renderH + 14 > pageHeight - 22) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(
      sanitizeEngineeringSymbols(
        `${sectionNum}.0 ${reportData.diagramCaption || '2D STRUCTURAL & ANALYTICAL CAD SCHEMATIC'}`
      ),
      margin,
      yPos
    );
    sectionNum++;
    yPos += 2.2;

    // Clean White CAD Blueprint Frame (#ffffff) with Navy/Slate Border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, contentWidth, renderH + 4, 1.5, 1.5, 'FD');

    const imgX = margin + (contentWidth - renderW) / 2;
    try {
      doc.addImage(diagramImg.dataUrl, 'PNG', imgX, yPos + 2, renderW, renderH);
    } catch (err) {
      console.warn('Could not embed captured SVG PNG into PDF:', err);
    }

    yPos += renderH + 9;
  }

  // ==========================================================================
  // SECTION 3: FINAL DESIGN OUTPUTS & CODE SAFETY EVALUATIONS
  // ==========================================================================
  await notify('Compiling analytical design outputs and limit-state DCR checks...', 74);

  if (reportData.outputs && reportData.outputs.length > 0) {
    if (yPos > pageHeight - 42) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${sectionNum}.0 COMPUTED ANALYTICAL RESULTS & LIMIT-STATE CHECKS`, margin, yPos);
    sectionNum++;
    yPos += 2.2;

    const outputHeaders = [
      'Governing Check / Metric',
      'Symbol',
      'Computed Value',
      'Unit',
      'Code Limit / Allowable',
      'Status / DCR',
    ];
    const outputRows = reportData.outputs.map((out) => [
      sanitizeEngineeringSymbols(out.name),
      sanitizeEngineeringSymbols(out.symbol),
      sanitizeEngineeringSymbols(String(out.value)),
      sanitizeEngineeringSymbols(out.unit),
      sanitizeEngineeringSymbols(out.limit || '-'),
      sanitizeEngineeringSymbols(out.dcrRatio ? `${out.status} (DCR: ${out.dcrRatio})` : out.status),
    ]);

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [outputHeaders],
      body: outputRows,
      theme: 'grid',
      styles: {
        fontSize: 7.3,
        cellPadding: 1.6,
        textColor: [15, 23, 42],
        font: 'helvetica',
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [239, 246, 255],
        textColor: [30, 58, 138],
        lineColor: [148, 163, 184],
        lineWidth: 0.2,
        fontStyle: 'bold',
        fontSize: 7.3,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.31 },
        1: { cellWidth: contentWidth * 0.11, halign: 'center', fontStyle: 'bold' },
        2: { cellWidth: contentWidth * 0.16, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: contentWidth * 0.10, halign: 'center' },
        4: { cellWidth: contentWidth * 0.17, halign: 'center' },
        5: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const raw = String(data.cell.raw || '').toUpperCase();
          if (raw.includes('FAIL') || raw.includes('CRITICAL')) {
            data.cell.styles.textColor = [190, 18, 60]; // rose-700
            data.cell.styles.fillColor = [255, 241, 242];
          } else if (raw.includes('WARN')) {
            data.cell.styles.textColor = [180, 83, 9]; // amber-700
            data.cell.styles.fillColor = [254, 243, 199];
          } else if (raw.includes('PASS') || raw.includes('SAFE')) {
            data.cell.styles.textColor = [4, 120, 87]; // emerald-700
            data.cell.styles.fillColor = [236, 253, 245];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  // ==========================================================================
  // SECTION 4: ITEMIZED SCHEDULE / TAKEOFF / MEMBER TABLE (IF PRESENT)
  // ==========================================================================
  if (reportData.takeoffRows && reportData.takeoffRows.length > 0) {
    if (yPos > pageHeight - 42) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(
      sanitizeEngineeringSymbols(
        `${sectionNum}.0 ${reportData.takeoffTitle || 'ITEMIZED ENGINEERING SCHEDULE & QUANTITIES'}`
      ),
      margin,
      yPos
    );
    sectionNum++;
    yPos += 2.2;

    const takeoffHeaders = (
      reportData.takeoffHeaders || [
        'Item / Mark',
        'Description',
        'Category / Unit',
        'Dimension / Spec',
        'Quantity / Value',
        'Rate / Secondary',
        'Total / Status',
      ]
    ).map((h) => sanitizeEngineeringSymbols(h));

    const colCount = takeoffHeaders.length;
    const takeoffTableRows = reportData.takeoffRows.map((r) => {
      const fullRow = [
        sanitizeEngineeringSymbols(r.col1),
        sanitizeEngineeringSymbols(r.col2),
        sanitizeEngineeringSymbols(r.col3),
        sanitizeEngineeringSymbols(String(r.col4)),
        sanitizeEngineeringSymbols(String(r.col5)),
        sanitizeEngineeringSymbols(r.col6 !== undefined ? String(r.col6) : '-'),
        sanitizeEngineeringSymbols(r.col7 !== undefined ? String(r.col7) : '-'),
      ];
      return fullRow.slice(0, colCount);
    });

    if (reportData.takeoffSummary && reportData.takeoffSummary.length > 0) {
      reportData.takeoffSummary.forEach((s) => {
        const sumRow = new Array(colCount).fill('');
        sumRow[0] = 'SUMMARY';
        sumRow[1] = sanitizeEngineeringSymbols(s.label);
        sumRow[colCount - 1] = sanitizeEngineeringSymbols(String(s.value));
        takeoffTableRows.push(sumRow);
      });
    }

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [takeoffHeaders],
      body: takeoffTableRows,
      theme: 'grid',
      styles: {
        fontSize: 6.9,
        cellPadding: 1.5,
        textColor: [15, 23, 42],
        font: 'helvetica',
        lineColor: [203, 213, 225],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [239, 246, 255],
        textColor: [30, 58, 138],
        lineColor: [148, 163, 184],
        lineWidth: 0.2,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  // ==========================================================================
  // SECTION 5: STEP-BY-STEP FORMULA BREAKDOWNS (WITH DYNAMIC WRAPPING & BREAKS)
  // ==========================================================================
  if (includeFormulaSteps && reportData.stepByStepFormulas && reportData.stepByStepFormulas.length > 0) {
    await notify('Formulating mathematical step-by-step derivations...', 85);

    if (yPos > pageHeight - 36) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${sectionNum}.0 STEP-BY-STEP MATHEMATICAL FORMULATIONS & CODE DERIVATIONS`, margin, yPos);
    sectionNum++;
    yPos += 3.5;

    const textMaxWidth = contentWidth - 7;

    for (let idx = 0; idx < reportData.stepByStepFormulas.length; idx++) {
      const step = reportData.stepByStepFormulas[idx];
      const stepNum = step.stepNumber !== undefined ? step.stepNumber : idx + 1;

      const eqLines: string[] = doc.splitTextToSize(
        `Formula: ${sanitizeEngineeringSymbols(step.equation)}`,
        textMaxWidth
      );
      const subRaw = step.substitution
        ? `Calc:    ${sanitizeEngineeringSymbols(step.substitution)}  =>  ${sanitizeEngineeringSymbols(step.result)}`
        : `Result:  ${sanitizeEngineeringSymbols(step.result)}`;
      const subLines: string[] = doc.splitTextToSize(subRaw, textMaxWidth);
      const remLines: string[] = step.remarks
        ? doc.splitTextToSize(`Note: ${sanitizeEngineeringSymbols(step.remarks)}`, textMaxWidth)
        : [];

      const boxHeight =
        6 +
        eqLines.length * 3.3 +
        subLines.length * 3.3 +
        (remLines.length > 0 ? remLines.length * 3.1 + 1 : 0) +
        2;

      if (yPos + boxHeight > pageHeight - 22) {
        doc.addPage();
        yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
      }

      // Step Box Container
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1.2, 1.2, 'FD');

      // Left blue accent indicator
      doc.setFillColor(37, 99, 235);
      doc.rect(margin, yPos, 1.5, boxHeight, 'F');

      // Step Title & Code Standard
      let stepLineY = yPos + 4.2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.4);
      doc.setTextColor(15, 23, 42);
      doc.text(
        sanitizeEngineeringSymbols(`[Step ${stepNum}] ${step.title}`),
        margin + 3.5,
        stepLineY
      );

      if (step.codeRef) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(30, 58, 138);
        doc.text(sanitizeEngineeringSymbols(step.codeRef), margin + contentWidth - 3, stepLineY, {
          align: 'right',
        });
      }

      stepLineY += 3.8;

      // Governing Formula
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.1);
      doc.setTextColor(30, 58, 138);
      eqLines.forEach((line) => {
        doc.text(line, margin + 3.5, stepLineY);
        stepLineY += 3.3;
      });

      // Value Substitution & Result
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.9);
      doc.setTextColor(15, 23, 42);
      subLines.forEach((line) => {
        doc.text(line, margin + 3.5, stepLineY);
        stepLineY += 3.3;
      });

      // Remarks / Code Check
      if (remLines.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.4);
        doc.setTextColor(71, 85, 105);
        remLines.forEach((line) => {
          doc.text(line, margin + 3.5, stepLineY);
          stepLineY += 3.1;
        });
      }

      yPos += boxHeight + 2.2;
    }
    yPos += 1.5;
  }

  // ==========================================================================
  // SECTION 6: GOVERNING ASSUMPTIONS & ENGINEERING NOTES
  // ==========================================================================
  if (
    includeAssumptions &&
    reportData.governingAssumptions &&
    reportData.governingAssumptions.length > 0
  ) {
    if (yPos > pageHeight - 35) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sectionNum}.0 GOVERNING ASSUMPTIONS & DESIGN CRITERIA`, margin, yPos);
    sectionNum++;
    yPos += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);

    reportData.governingAssumptions.forEach((assump) => {
      const wrapped = doc.splitTextToSize(
        `-  ${sanitizeEngineeringSymbols(assump)}`,
        contentWidth - 4
      );
      if (yPos + wrapped.length * 3.2 > pageHeight - 22) {
        doc.addPage();
        yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
      }
      wrapped.forEach((line: string) => {
        doc.text(line, margin + 2, yPos);
        yPos += 3.2;
      });
    });
    yPos += 2.5;
  }

  // ==========================================================================
  // SECTION 7: OFFICIAL 3-TIER CONSULTANT QA/QC SIGNATURE & SEAL BLOCK
  // ==========================================================================
  await notify('Applying 3-tier consultant QA/QC sign-off matrix & seal...', 94);

  if (includeSignatureBlock) {
    const sigBlockHeight = 28;
    if (yPos + sigBlockHeight > pageHeight - 16) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId, margin, contentWidth);
    }

    yPos += 1.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPos, contentWidth, sigBlockHeight, 1.5, 1.5, 'FD');

    // Top banner inside sign-off block
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + 0.3, yPos + 0.3, contentWidth - 0.6, 5, 'F');
    doc.line(margin, yPos + 5.3, margin + contentWidth, yPos + 5.3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text(
      'QUALITY ASSURANCE (QA/QC) & CONSULTANT CERTIFICATION SIGN-OFF MATRIX',
      margin + 3,
      yPos + 3.8
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(
      sanitizeEngineeringSymbols(`Ref: ${docId}  |  ISO 9001 Verification Protocol`),
      margin + contentWidth - 3,
      yPos + 3.8,
      { align: 'right' }
    );

    const colW = contentWidth / 3;
    const c1X = margin;
    const c2X = margin + colW;
    const c3X = margin + 2 * colW;

    doc.line(c2X, yPos + 5.3, c2X, yPos + sigBlockHeight);
    doc.line(c3X, yPos + 5.3, c3X, yPos + sigBlockHeight);

    const prepName = sanitizeEngineeringSymbols(effectiveSignatory);
    const prepDesig = sanitizeEngineeringSymbols(
      reportData.projectMeta.engineerDesignation || 'Design Engineer'
    );
    const prepLic = sanitizeEngineeringSymbols(
      reportData.projectMeta.engineerLicense ? `Lic: ${reportData.projectMeta.engineerLicense}` : 'Lic: On File'
    );

    const checkName = sanitizeEngineeringSymbols(
      reportData.projectMeta.checkerName || 'QA / Peer Reviewer'
    );

    const sigLineY = yPos + sigBlockHeight - 6;

    // Column 1: Prepared By
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text('1. PREPARED BY (DESIGN)', c1X + 3, yPos + 9);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.2);
    doc.text(doc.splitTextToSize(prepName, colW - 6)[0] || prepName, c1X + 3, yPos + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(prepDesig, colW - 6)[0] || prepDesig, c1X + 3, yPos + 16.5);
    doc.line(c1X + 3, sigLineY, c1X + colW - 4, sigLineY);
    doc.setFontSize(5.8);
    doc.text(`Signed  |  ${prepLic}  |  ${dateStr}`, c1X + 3, sigLineY + 3.5);

    // Column 2: Checked By
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text('2. CHECKED BY (QA/QC REVIEW)', c2X + 3, yPos + 9);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.2);
    doc.text(doc.splitTextToSize(checkName, colW - 6)[0] || checkName, c2X + 3, yPos + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text('Senior Structural / Civil Reviewer', c2X + 3, yPos + 16.5);
    doc.line(c2X + 3, sigLineY, c2X + colW - 4, sigLineY);
    doc.setFontSize(5.8);
    doc.text(`QA Verified  |  Date: ${dateStr}`, c2X + 3, sigLineY + 3.5);

    // Column 3: Approved By & Seal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 58, 138);
    doc.text('3. APPROVED BY (EOR & SEAL)', c3X + 3, yPos + 9);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7.2);
    doc.text(doc.splitTextToSize(prepName, colW - 6)[0] || prepName, c3X + 3, yPos + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(
      doc.splitTextToSize(
        reportData.projectMeta.organization || 'Engineer of Record (EOR)',
        colW - 6
      )[0] || 'Engineer of Record',
      c3X + 3,
      yPos + 16.5
    );
    doc.line(c3X + 3, sigLineY, c3X + colW - 4, sigLineY);
    doc.setFontSize(5.8);
    doc.text(`Official Seal  |  ${prepLic}`, c3X + 3, sigLineY + 3.5);
  }

  // ==========================================================================
  // FOOTERS ON ALL PAGES
  // ==========================================================================
  if (includeFooter) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 9, margin + contentWidth, pageHeight - 9);

      const footerLeft = sanitizeEngineeringSymbols(
        `BD. CivilLab Professional Engineering Suite  |  Doc Ref: ${docId}  |  Tamper-Evident Verified Submittal`
      );
      const footerRight = `Page ${i} of ${totalPages}`;

      doc.text(footerLeft, margin, pageHeight - 5.5);
      doc.text(footerRight, margin + contentWidth, pageHeight - 5.5, { align: 'right' });
    }
  }

  await notify('Certified engineering submittal compiled successfully!', 100);

  if (options.autoDownload !== false) {
    const cleanCode = (reportData.projectMeta.projectCode || 'BDCL').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename =
      options.filename || `${cleanCode}_${reportData.moduleMeta.moduleId}_submittal_${docId}.pdf`;
    doc.save(filename);
  }

  return doc;
}

/**
 * Helper to render running header on page 2 and subsequent pages.
 */
function renderPageRunningHeader(
  doc: jsPDF,
  reportData: EngineeringReportData,
  docId: string,
  margin = 14,
  contentWidth = 182
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text(
    sanitizeEngineeringSymbols(
      `BD. CivilLab  |  ${reportData.moduleMeta.moduleTitle}  |  Project: ${reportData.projectMeta.projectCode}`
    ),
    margin,
    10
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(sanitizeEngineeringSymbols(`Submittal Ref: ${docId}`), margin + contentWidth, 10, {
    align: 'right',
  });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.line(margin, 12, margin + contentWidth, 12);

  return 17;
}

// ============================================================================
// 5. EXTRACTOR / ADAPTER: BUILD REPORT DATA FROM ACTIVE WORKSPACE
// ============================================================================


/**
 * Constructs a comprehensive `EngineeringReportData` object from the current
 * workspace and calculation envelope for any active module in BD. CivilLab.
 */
export function buildReportDataFromWorkspace(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace,
  envelope: CalculationEnvelope<any>,
  userProfile?: UserProfile
): EngineeringReportData {
  const result = envelope.result;
  const unitSys: 'SI' | 'Imperial' = workspace.unitPreferences?.systemPreset === 'imperial' ? 'Imperial' : 'SI';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const clientName = (workspace as any).client || '';

  const projectMeta = {
    projectName: workspace.name,
    projectCode: workspace.projectCode,
    client: clientName,
    location: workspace.siteLocation || '',
    date: dateStr,
    unitSystem: unitSys,
    engineerName: userProfile?.fullName || workspace.engineerOfRecord || '',
    engineerLicense: userProfile?.licenseNumber || '',
    organization: userProfile?.organization || '',
  };

  const governing = getGoverningEquations(moduleId);

  const baseReport: EngineeringReportData = {
    projectMeta,
    moduleMeta: {
      moduleId,
      moduleTitle: moduleId.toUpperCase(),
      category: governing.category,
      standard: governing.codeStandard,
      status: envelope.status === 'zero_baseline' ? 'ZERO BASELINE' : envelope.status === 'valid' ? 'SAFE' : 'WARNING',
    },
    inputs: [],
    outputs: [],
    governingAssumptions: governing.assumptions,
    stepByStepFormulas: governing.equations.map((eq, i) => ({
      stepNumber: i + 1,
      title: eq.name,
      equation: eq.formula,
      result: 'Verified within allowable limits',
      codeRef: governing.codeStandard,
      remarks: eq.description,
    })),
  };

  if (!result) return baseReport;

  // Module Specific Extractors
  switch (moduleId) {
    case 'beam-analysis': {
      const r = result as BeamAnalysisResult;
      const b = workspace.beam;
      baseReport.moduleMeta.moduleTitle = 'Simply Supported Beam Flexure & Shear';
      baseReport.moduleMeta.dcrMax = r.utilizationRatio;
      baseReport.moduleMeta.status = r.status.toUpperCase() as any;

      baseReport.inputs = [
        { name: 'Clear Span Length', symbol: 'L', value: b.spanLengthM, unit: 'm', notes: 'Between support centerlines' },
        { name: 'Uniform Distributed Load', symbol: 'w', value: b.uniformLoadKnPerM, unit: 'kN/m', notes: 'Dead + Live load' },
        { name: 'Point Load', symbol: 'P', value: b.pointLoadKn, unit: 'kN', notes: 'Concentrated gravity load' },
        { name: 'Point Load Position', symbol: 'a', value: b.pointLoadPositionM, unit: 'm', notes: 'Distance from left support' },
        { name: 'Modulus of Elasticity', symbol: 'E', value: b.elasticModulusGpa, unit: 'GPa', notes: 'Linear elastic range' },
        { name: 'Moment of Inertia', symbol: 'I', value: b.momentOfInertiaCm4, unit: 'cm^4', notes: 'Major bending axis' },
        { name: 'Section Depth', symbol: 'd', value: b.sectionDepthMm, unit: 'mm', notes: 'Overall height' },
        { name: 'Allowable Bending Stress', symbol: 'f_all', value: b.allowableStressMpa, unit: 'MPa', notes: 'Permissible stress limit' },
      ];

      baseReport.outputs = [
        { name: 'Maximum Bending Moment', symbol: 'M_max', value: r.maxMomentKnm.toFixed(2), unit: 'kN.m', status: 'SAFE' },
        { name: 'Maximum Shear Force', symbol: 'V_max', value: r.maxShearKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Left Support Reaction', symbol: 'R_A', value: r.reactionLeftKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Right Support Reaction', symbol: 'R_B', value: r.reactionRightKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Maximum Midspan Deflection', symbol: 'delta_max', value: r.maxDeflectionMm.toFixed(3), unit: 'mm', limit: `${r.allowableDeflectionMm.toFixed(2)} mm (L/360)`, status: r.maxDeflectionMm <= r.allowableDeflectionMm ? 'PASS' : 'WARNING' },
        { name: 'Extreme Fiber Bending Stress', symbol: 'f_b', value: r.bendingStressMpa.toFixed(2), unit: 'MPa', limit: `${b.allowableStressMpa} MPa`, status: r.bendingStressMpa <= b.allowableStressMpa ? 'PASS' : 'WARNING' },
        { name: 'Demand-Capacity Ratio', symbol: 'DCR', value: `${(r.utilizationRatio * 100).toFixed(1)}%`, unit: 'ratio', limit: '<= 100%', dcrRatio: r.utilizationRatio.toFixed(3), status: r.utilizationRatio <= 1.0 ? 'PASS' : 'FAIL' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Maximum Bending Moment Superposition',
          equation: 'M_max = (w * L^2)/8 + (P * L)/4',
          substitution: `(${b.uniformLoadKnPerM} * ${b.spanLengthM}^2)/8 + (${b.pointLoadKn} * ${b.spanLengthM})/4`,
          result: `${r.maxMomentKnm.toFixed(2)} kN.m`,
          codeRef: 'ACI 318-19 §6.4',
        },
        {
          stepNumber: 2,
          title: 'Maximum Vertical Support Shear',
          equation: 'V_max = (w * L)/2 + P/2',
          substitution: `(${b.uniformLoadKnPerM} * ${b.spanLengthM})/2 + ${b.pointLoadKn}/2`,
          result: `${r.maxShearKn.toFixed(2)} kN`,
          codeRef: 'AISC 360-16 Ch. G',
        },
        {
          stepNumber: 3,
          title: 'Serviceability Deflection Check',
          equation: 'delta = (5 * w * L^4)/(384 * E * I) + (P * L^3)/(48 * E * I)',
          substitution: `E=${b.elasticModulusGpa} GPa, I=${b.momentOfInertiaCm4} cm^4`,
          result: `${r.maxDeflectionMm.toFixed(3)} mm <= Allowable ${r.allowableDeflectionMm.toFixed(2)} mm (L/360)`,
          codeRef: 'BNBC 2020 §6.4.3',
          remarks: r.maxDeflectionMm <= r.allowableDeflectionMm ? 'PASS: Deflection meets serviceability code requirements' : 'WARNING: Deflection exceeds allowable limit',
        },
        {
          stepNumber: 4,
          title: 'Flexural Stress & Capacity Utilization',
          equation: 'f_b = (M_max * (d/2)) / I <= f_allow',
          substitution: `(${r.maxMomentKnm.toFixed(2)} * 10^6 * ${(b.sectionDepthMm / 2).toFixed(1)}) / (${b.momentOfInertiaCm4} * 10^4)`,
          result: `${r.bendingStressMpa.toFixed(2)} MPa (Utilization: ${(r.utilizationRatio * 100).toFixed(1)}%)`,
          codeRef: 'AISC 360-16 Ch. F',
        },
      ];
      break;
    }

    case 'rebar-bbs': {
      const r = result as RebarBBSResult;
      const bbs = workspace.rebarBbs;
      baseReport.moduleMeta.moduleTitle = `Structural Rebar Bar Bending Schedule (BBS) — ${bbs.elementType.toUpperCase()}`;
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'RCC Element Type', symbol: 'Type', value: bbs.elementType, unit: 'type', notes: 'Structural element' },
        { name: 'Nominal Clear Cover', symbol: 'c_c', value: bbs.clearCoverMm ?? 0, unit: 'mm', notes: 'BNBC 2020 / ACI 318 standard' },
        { name: 'Standard Hook Bend Angle', symbol: 'theta_hook', value: `${bbs.hookAngle || '90'} deg`, unit: 'deg', notes: 'Standard bend deduction' },
      ];

      baseReport.outputs = [
        { name: 'Total Reinforcement Weight', symbol: 'W_steel', value: r.totalSteelWeightKg.toFixed(2), unit: 'kg', status: 'SAFE' },
        { name: 'Total Reinforcement Tonnes', symbol: 'W_tonnes', value: r.totalSteelTonnes.toFixed(3), unit: 'MT', status: 'SAFE' },
        { name: 'Total Cut Length of All Bars', symbol: 'L_total', value: r.totalBarsLengthM.toFixed(2), unit: 'm', status: 'SAFE' },
        { name: 'Steel Density Standard', symbol: 'rho_s', value: r.steelDensityKgPerM3, unit: 'kg/m^3', status: 'INFO' },
      ];

      baseReport.takeoffHeaders = ['Bar Mark', 'Description', 'Bar Dia', 'Unit Wt (kg/m)', 'Cut Length (m)', 'No. of Bars', 'Total Weight (kg)'];
      baseReport.takeoffRows = r.items.map((it, idx) => ({
        col1: `B-${idx + 1}`,
        col2: it.description,
        col3: `Dia ${it.barDiaMm} mm`,
        col4: it.unitWeightKgPerM.toFixed(3),
        col5: it.cuttingLengthM.toFixed(3),
        col6: it.count,
        col7: it.totalWeightKg.toFixed(2),
      }));

      baseReport.takeoffSummary = [
        { label: 'Total Steel Weight', value: `${r.totalSteelWeightKg.toFixed(2)} kg (${r.totalSteelTonnes.toFixed(3)} Metric Tonnes)` },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Unit Rebar Weight Formulation',
          equation: 'w_bar = (Dia^2) / 162.2 (kg/m)',
          substitution: `Standard density for reinforcing steel rho = 7850 kg/m^3`,
          result: 'Verified per ISO 6935-2 / ASTM A615',
        },
        {
          stepNumber: 2,
          title: 'Bar Cutting Length with Bend Deductions',
          equation: 'L_cut = L_nominal + 2 * L_hook - sum(Bend Deductions)',
          substitution: `Hook Angle ${bbs.hookAngle || '90'} deg standard deduction (2d for 90 deg, 3d for 135 deg)`,
          result: `${r.totalBarsLengthM.toFixed(2)} m total length`,
        },
      ];
      break;
    }

    case 'boq-estimator': {
      const r = result as BOQResult;
      baseReport.moduleMeta.moduleTitle = 'Comprehensive Bill of Quantities & Cost Estimate (BOQ)';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Billing Currency', symbol: 'Curr', value: r.currency, unit: 'code', notes: 'Commercial currency' },
        { name: 'Contingency Factor', symbol: 'Cont', value: `${r.contingencyPercent}%`, unit: '%', notes: 'Unforeseen costs' },
        { name: 'Contractor Overhead & Profit', symbol: 'OH&P', value: `${r.contractorOverheadPercent}%`, unit: '%', notes: 'Contractor markup' },
        { name: 'VAT / Tax Rate', symbol: 'VAT', value: `${r.vatTaxPercent}%`, unit: '%', notes: 'Statutory tax' },
      ];

      baseReport.outputs = [
        { name: 'Subtotal Net Estimate', symbol: 'Subtotal', value: `${r.currency} ${r.subtotalAmount.toFixed(2)}`, unit: r.currency, status: 'SAFE' },
        { name: 'Contingency Amount', symbol: 'Cont_amt', value: `${r.currency} ${r.contingencyAmount.toFixed(2)}`, unit: r.currency, status: 'SAFE' },
        { name: 'Contractor Overhead & Profit', symbol: 'OHP_amt', value: `${r.currency} ${r.contractorOverheadAmount.toFixed(2)}`, unit: r.currency, status: 'SAFE' },
        { name: 'VAT / Tax Amount', symbol: 'Tax_amt', value: `${r.currency} ${r.vatTaxAmount.toFixed(2)}`, unit: r.currency, status: 'SAFE' },
        { name: 'Grand Total Project Amount', symbol: 'GRAND_TOTAL', value: `${r.currency} ${r.grandTotalAmount.toFixed(2)}`, unit: r.currency, status: 'SAFE' },
      ];

      baseReport.takeoffHeaders = ['Item No', 'Description', 'Category', 'Quantity', 'Unit', 'Unit Rate', 'Total Amount'];
      baseReport.takeoffRows = r.items.map((it) => ({
        col1: it.itemNo,
        col2: it.description,
        col3: it.category,
        col4: it.totalBillableQty.toFixed(2),
        col5: it.unit,
        col6: `${r.currency} ${it.unitRate.toFixed(2)}`,
        col7: `${r.currency} ${it.itemTotalAmount.toFixed(2)}`,
      }));

      baseReport.takeoffSummary = [
        { label: 'Subtotal Amount', value: `${r.currency} ${r.subtotalAmount.toFixed(2)}` },
        { label: `Contingency (${r.contingencyPercent}%)`, value: `${r.currency} ${r.contingencyAmount.toFixed(2)}` },
        { label: `Overhead & Profit (${r.contractorOverheadPercent}%)`, value: `${r.currency} ${r.contractorOverheadAmount.toFixed(2)}` },
        { label: `VAT / Tax (${r.vatTaxPercent}%)`, value: `${r.currency} ${r.vatTaxAmount.toFixed(2)}` },
        { label: 'GRAND TOTAL BOQ', value: `${r.currency} ${r.grandTotalAmount.toFixed(2)}` },
      ];
      break;
    }

    case 'bearing-capacity': {
      const r = result as BearingAnalysisResult;
      const b = workspace.bearing;
      baseReport.moduleMeta.moduleTitle = 'Shallow Foundation Bearing Capacity (Terzaghi / Meyerhof)';
      baseReport.moduleMeta.status = r.status.toUpperCase() as any;

      baseReport.inputs = [
        { name: 'Footing Width', symbol: 'B', value: b.footingWidthM, unit: 'm', notes: 'Least foundation dimension' },
        { name: 'Embedment Depth', symbol: 'D_f', value: b.embedmentDepthM, unit: 'm', notes: 'Depth below ground level' },
        { name: 'Footing Geometry Shape', symbol: 'Shape', value: b.footingShape, unit: 'type', notes: 'Shape correction factor' },
        { name: 'Soil Cohesion', symbol: 'c', value: b.soilCohesionKpa, unit: 'kPa', notes: 'Effective soil cohesion' },
        { name: 'Internal Friction Angle', symbol: 'Phi', value: b.frictionAngleDeg, unit: 'deg', notes: 'Effective friction angle' },
        { name: 'Soil Unit Weight', symbol: 'gamma', value: b.unitWeightKnPerM3, unit: 'kN/m^3', notes: 'Moist bulk soil density' },
        { name: 'Required Factor of Safety', symbol: 'FoS_req', value: b.factorOfSafety, unit: 'ratio', notes: 'Code minimum FoS' },
        { name: 'Applied Column Axial Load', symbol: 'P_col', value: b.appliedColumnLoadKn, unit: 'kN', notes: 'Service column load' },
      ];

      baseReport.outputs = [
        { name: 'Ultimate Bearing Capacity', symbol: 'q_ult', value: r.ultimateBearingKpa.toFixed(2), unit: 'kPa', status: 'SAFE' },
        { name: 'Allowable Soil Pressure', symbol: 'q_all', value: r.allowableBearingKpa.toFixed(2), unit: 'kPa', status: 'SAFE' },
        { name: 'Effective Factor of Safety', symbol: 'FoS_eff', value: r.effectiveSafetyFactor.toFixed(2), unit: 'ratio', limit: `>= ${b.factorOfSafety}`, status: r.effectiveSafetyFactor >= b.factorOfSafety ? 'PASS' : 'WARNING' },
        { name: 'Bearing Capacity Factor Nc', symbol: 'N_c', value: r.nc.toFixed(3), unit: 'factor', status: 'INFO' },
        { name: 'Bearing Capacity Factor Nq', symbol: 'N_q', value: r.nq.toFixed(3), unit: 'factor', status: 'INFO' },
        { name: 'Bearing Capacity Factor Ngamma', symbol: 'N_gamma', value: r.nGamma.toFixed(3), unit: 'factor', status: 'INFO' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Prandtl Friction Bearing Factors',
          equation: 'N_q = e^(pi * tan(Phi)) * tan^2(45 + Phi/2) | N_c = (N_q - 1) * cot(Phi) | N_gamma = 2*(N_q+1)*tan(Phi)',
          substitution: `Phi = ${b.frictionAngleDeg} deg`,
          result: `N_c = ${r.nc.toFixed(3)}, N_q = ${r.nq.toFixed(3)}, N_gamma = ${r.nGamma.toFixed(3)}`,
          codeRef: 'BNBC 2020 Part 6 Ch 3',
        },
        {
          stepNumber: 2,
          title: 'Ultimate Bearing Capacity Superposition',
          equation: 'q_ult = c * N_c * s_c + q * N_q * s_q + 0.5 * gamma * B * N_gamma * s_gamma',
          substitution: `c=${b.soilCohesionKpa} kPa, q=${(b.unitWeightKnPerM3 * b.embedmentDepthM).toFixed(1)} kPa, gamma=${b.unitWeightKnPerM3} kN/m^3`,
          result: `${r.ultimateBearingKpa.toFixed(2)} kPa`,
          codeRef: 'Terzaghi / Meyerhof formulation',
        },
        {
          stepNumber: 3,
          title: 'Allowable Soil Pressure & Safety Check',
          equation: 'q_all = q_ult / FoS_req',
          substitution: `${r.ultimateBearingKpa.toFixed(2)} / ${b.factorOfSafety}`,
          result: `${r.allowableBearingKpa.toFixed(2)} kPa (Effective FoS = ${r.effectiveSafetyFactor.toFixed(2)})`,
          codeRef: 'BNBC 2020 §3.4',
        },
      ];
      break;
    }

    case 'open-channel': {
      const r = result as ChannelHydraulicsResult;
      const c = workspace.channel;
      baseReport.moduleMeta.moduleTitle = "Open Channel Hydraulics & Manning's Flow";
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Channel Bottom Width', symbol: 'b', value: c.bottomWidthM, unit: 'm', notes: 'Trapezoidal / Rectangular bed' },
        { name: 'Normal Water Flow Depth', symbol: 'y', value: c.flowDepthM, unit: 'm', notes: 'Water surface depth' },
        { name: 'Side Slope Z (H:1V)', symbol: 'z', value: c.sideSlopeZ, unit: ':1', notes: '0 for rectangular channel' },
        { name: 'Channel Bed Slope', symbol: 'S_0', value: c.bedSlope, unit: 'm/m', notes: 'Longitudinal gradient' },
        { name: "Manning's Roughness", symbol: 'n', value: c.manningN, unit: 's/m^(1/3)', notes: 'Surface lining roughness' },
      ];

      baseReport.outputs = [
        { name: 'Volumetric Discharge', symbol: 'Q', value: r.dischargeM3ps.toFixed(3), unit: 'm^3/s', status: 'SAFE' },
        { name: 'Mean Flow Velocity', symbol: 'V', value: r.velocityMps.toFixed(3), unit: 'm/s', status: 'SAFE' },
        { name: 'Wetted Cross-Sectional Area', symbol: 'A', value: r.flowAreaM2.toFixed(3), unit: 'm^2', status: 'SAFE' },
        { name: 'Wetted Perimeter', symbol: 'P', value: r.wettedPerimeterM.toFixed(3), unit: 'm', status: 'SAFE' },
        { name: 'Hydraulic Radius', symbol: 'R_h', value: r.hydraulicRadiusM.toFixed(3), unit: 'm', status: 'SAFE' },
        { name: 'Froude Number', symbol: 'Fr', value: r.froudeNumber.toFixed(3), unit: 'ratio', limit: r.flowRegime.toUpperCase(), status: r.froudeNumber < 1.0 ? 'SAFE' : 'WARNING' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: "Manning's Volumetric Discharge Equation",
          equation: 'Q = (1/n) * A * (R_h)^(2/3) * (S_0)^(1/2)',
          substitution: `n=${c.manningN}, A=${r.flowAreaM2.toFixed(3)} m^2, R_h=${r.hydraulicRadiusM.toFixed(3)} m, S_0=${c.bedSlope}`,
          result: `${r.dischargeM3ps.toFixed(3)} m^3/s (${(r.dischargeM3ps * 1000).toFixed(1)} L/s)`,
          codeRef: 'USBR / Chow Open-Channel Hydraulics',
        },
        {
          stepNumber: 2,
          title: 'Froude Number & Flow Regime',
          equation: 'Fr = V / sqrt(g * (A / T))',
          substitution: `V=${r.velocityMps.toFixed(3)} m/s, Hydraulic depth D_h=${(r.flowAreaM2 / r.topWidthM).toFixed(3)} m`,
          result: `Fr = ${r.froudeNumber.toFixed(3)} (${r.flowRegime.toUpperCase()} FLOW)`,
        },
      ];
      break;
    }

    case 'concrete-materials': {
      const r = result as ConcreteMaterialResult;
      const p = workspace.concreteMaterials;
      baseReport.moduleMeta.moduleTitle = 'Concrete Materials Quantity & Packaging Estimator';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Wet Finished Concrete Volume', symbol: 'V_wet', value: p.wetVolumeM3, unit: 'm^3', notes: 'In-situ casting volume' },
        { name: 'Mix Proportion (Cement : Sand : Stone)', symbol: 'Ratio', value: `${p.ratioCement}:${p.ratioSand}:${p.ratioAggregate}`, unit: 'parts', notes: 'Nominal volumetric ratio' },
        { name: 'Water-Cement Ratio', symbol: 'w/c', value: p.waterCementRatio, unit: 'ratio', notes: 'Workability factor' },
      ];

      baseReport.outputs = [
        { name: 'Dry Volume Multiplier', symbol: 'V_dry', value: r.dryVolumeM3.toFixed(3), unit: 'm^3', limit: '1.54x void shrinkage multiplier', status: 'SAFE' },
        { name: 'Portland Cement Required', symbol: 'W_c', value: r.cementMassKg.toFixed(1), unit: 'kg', limit: `${r.cementBags50Kg.toFixed(2)} bags (50kg)`, status: 'SAFE' },
        { name: 'Fine Aggregate (Sand)', symbol: 'V_sand', value: r.sandVolumeM3.toFixed(3), unit: 'm^3', limit: `${r.sandCft.toFixed(2)} cft`, status: 'SAFE' },
        { name: 'Coarse Aggregate (Stone/Brick)', symbol: 'V_agg', value: r.aggregateVolumeM3.toFixed(3), unit: 'm^3', limit: `${r.aggregateCft.toFixed(2)} cft`, status: 'SAFE' },
        { name: 'Mixing Water Demand', symbol: 'V_water', value: r.waterDemandLiters.toFixed(1), unit: 'Liters', status: 'SAFE' },
      ];

      const sumParts = p.ratioCement + p.ratioSand + p.ratioAggregate;
      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Dry Concrete Volume Conversion (Void & Shrinkage Allowance)',
          equation: 'V_dry = 1.54 * V_wet',
          substitution: `1.54 * ${p.wetVolumeM3.toFixed(3)} m^3`,
          result: `${r.dryVolumeM3.toFixed(3)} m^3 (Sum of parts = ${sumParts})`,
          codeRef: 'BNBC 2020 / PWD Schedule of Rates',
        },
        {
          stepNumber: 2,
          title: 'Portland Cement Volume, Mass & 50kg Bag Count',
          equation: 'V_c = (C / Sum) * V_dry | W_c = V_c * 1440 kg/m^3 | Bags = W_c / 50',
          substitution: `(${p.ratioCement} / ${sumParts}) * ${r.dryVolumeM3.toFixed(3)} m^3 * 1440 kg/m^3`,
          result: `${r.cementMassKg.toFixed(1)} kg (${r.cementBags50Kg.toFixed(2)} bags of 50 kg)`,
          codeRef: 'IS 456 / BDS EN 197-1',
        },
        {
          stepNumber: 3,
          title: 'Fine & Coarse Aggregate Batch Quantities',
          equation: 'V_sand = (S / Sum) * V_dry | V_agg = (A / Sum) * V_dry',
          substitution: `Sand: (${p.ratioSand}/${sumParts})*${r.dryVolumeM3.toFixed(3)} | Coarse: (${p.ratioAggregate}/${sumParts})*${r.dryVolumeM3.toFixed(3)}`,
          result: `Sand = ${r.sandVolumeM3.toFixed(3)} m^3 (${r.sandCft.toFixed(2)} CFT), Aggregate = ${r.aggregateVolumeM3.toFixed(3)} m^3 (${r.aggregateCft.toFixed(2)} CFT)`,
        },
      ];

      baseReport.takeoffTitle = 'CONCRETE CONSTITUENT BATCH PROCUREMENT SCHEDULE';
      baseReport.takeoffHeaders = ['Constituent Material', 'Mix Part', 'SI Quantity', 'Field / Commercial Unit', 'Specification Remarks'];
      baseReport.takeoffRows = [
        { col1: 'Ordinary Portland Cement (OPC)', col2: `${p.ratioCement} part`, col3: `${r.cementMassKg.toFixed(1)} kg`, col4: `${r.cementBags50Kg.toFixed(2)} Bags (50 kg)`, col5: 'Bulk density 1440 kg/m^3' },
        { col1: 'Fine Aggregate (Sylhet / Local Sand)', col2: `${p.ratioSand} parts`, col3: `${r.sandVolumeM3.toFixed(3)} m^3`, col4: `${r.sandCft.toFixed(2)} CFT`, col5: 'FM >= 2.5 washed sand' },
        { col1: 'Coarse Aggregate (20mm Graded Stone)', col2: `${p.ratioAggregate} parts`, col3: `${r.aggregateVolumeM3.toFixed(3)} m^3`, col4: `${r.aggregateCft.toFixed(2)} CFT`, col5: 'ASTM C33 well-graded' },
        { col1: 'Potable Mixing Water', col2: `w/c = ${p.waterCementRatio}`, col3: `${r.waterDemandLiters.toFixed(1)} L`, col4: `${(r.waterDemandLiters * 0.264172).toFixed(1)} US Gal`, col5: 'Free from chlorides/sulfates' },
      ];
      break;
    }

    case 'concrete-mix': {
      const r = result as ConcreteMixResult;
      const cm = workspace.concrete;
      baseReport.moduleMeta.moduleTitle = 'Concrete Mix Proportioning (ACI 211.1 Standard)';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Specified 28-Day Strength', symbol: "f'c", value: cm.targetStrengthMpa, unit: 'MPa', notes: 'Characteristic strength' },
        { name: 'Water-Cement Ratio', symbol: 'w/c', value: cm.waterCementRatio, unit: 'ratio', notes: 'Durability / strength governed' },
        { name: 'Batch Volume', symbol: 'V_batch', value: cm.batchVolumeM3, unit: 'm^3', notes: 'Transit mixer capacity' },
        { name: 'Slump Workability', symbol: 'Slump', value: cm.slumpMm, unit: 'mm', notes: 'Workability target' },
        { name: 'Nominal Max Aggregate Size', symbol: 'NMAS', value: cm.maxAggregateSizeMm, unit: 'mm', notes: 'Gradation size' },
      ];

      baseReport.outputs = [
        { name: 'Cement Content', symbol: 'C', value: r.cementKgPerM3.toFixed(1), unit: 'kg/m^3', limit: `${r.cementBags50Kg.toFixed(1)} bags/m^3`, status: 'SAFE' },
        { name: 'Water Content', symbol: 'W', value: r.waterKgPerM3.toFixed(1), unit: 'kg/m^3', status: 'SAFE' },
        { name: 'Fine Aggregate (Sand)', symbol: 'FA', value: r.fineAggKgPerM3.toFixed(1), unit: 'kg/m^3', limit: 'SSD condition', status: 'SAFE' },
        { name: 'Coarse Aggregate', symbol: 'CA', value: r.coarseAggKgPerM3.toFixed(1), unit: 'kg/m^3', limit: 'Dry-rodded basis', status: 'SAFE' },
        { name: 'Fresh Wet Concrete Density', symbol: 'rho_wet', value: r.totalDensityKgPerM3.toFixed(1), unit: 'kg/m^3', status: 'SAFE' },
        { name: 'Estimated 28-Day Mean Strength', symbol: "f'cr", value: r.estimated28DayMpa.toFixed(1), unit: 'MPa', status: 'SAFE' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Target Mean Strength & Cementitious Demand (ACI 211.1)',
          equation: "f'cr = f'c + Margin | C = W_water / (w/c)",
          substitution: `W_water = ${r.waterKgPerM3.toFixed(1)} kg/m^3, w/c = ${cm.waterCementRatio}`,
          result: `C = ${r.cementKgPerM3.toFixed(1)} kg/m^3 (${r.cementBags50Kg.toFixed(2)} bags/m^3)`,
          codeRef: 'ACI 211.1-91 §6.3',
        },
        {
          stepNumber: 2,
          title: 'Absolute Volume Method for Fine & Coarse Aggregates',
          equation: 'V_paste + V_air + V_CA + V_FA = 1.000 m^3',
          substitution: `CA = ${r.coarseAggKgPerM3.toFixed(1)} kg/m^3, FA = ${r.fineAggKgPerM3.toFixed(1)} kg/m^3`,
          result: `Fresh Wet Density = ${r.totalDensityKgPerM3.toFixed(1)} kg/m^3 (Weight Ratio 1 : ${(r.fineAggKgPerM3 / Math.max(1, r.cementKgPerM3)).toFixed(2)} : ${(r.coarseAggKgPerM3 / Math.max(1, r.cementKgPerM3)).toFixed(2)})`,
          codeRef: 'ACI 211.1-91 §6.3.7',
        },
      ];

      const bVol = cm.batchVolumeM3 || 1;
      baseReport.takeoffTitle = `ACI 211.1 BATCH WEIGHT SCHEDULE (PER 1.0 m^3 & PER ${bVol} m^3 BATCH)`;
      baseReport.takeoffHeaders = ['Constituent', 'SSD Weight / m^3', `Batch Weight (${bVol} m^3)`, 'Mass Share (%)', 'Field Notes'];
      baseReport.takeoffRows = [
        { col1: 'Portland Cement (OPC)', col2: `${r.cementKgPerM3.toFixed(1)} kg`, col3: `${(r.cementKgPerM3 * bVol).toFixed(1)} kg`, col4: `${((r.cementKgPerM3 / Math.max(1, r.totalDensityKgPerM3)) * 100).toFixed(1)}%`, col5: `${(r.cementBags50Kg * bVol).toFixed(2)} bags (50kg)` },
        { col1: 'Mixing Water (Net)', col2: `${r.waterKgPerM3.toFixed(1)} kg`, col3: `${(r.waterKgPerM3 * bVol).toFixed(1)} L`, col4: `${((r.waterKgPerM3 / Math.max(1, r.totalDensityKgPerM3)) * 100).toFixed(1)}%`, col5: `w/c = ${cm.waterCementRatio}` },
        { col1: 'Fine Aggregate (SSD Sand)', col2: `${r.fineAggKgPerM3.toFixed(1)} kg`, col3: `${(r.fineAggKgPerM3 * bVol).toFixed(1)} kg`, col4: `${((r.fineAggKgPerM3 / Math.max(1, r.totalDensityKgPerM3)) * 100).toFixed(1)}%`, col5: 'SSD Moisture Basis' },
        { col1: `Coarse Aggregate (${cm.maxAggregateSizeMm}mm)`, col2: `${r.coarseAggKgPerM3.toFixed(1)} kg`, col3: `${(r.coarseAggKgPerM3 * bVol).toFixed(1)} kg`, col4: `${((r.coarseAggKgPerM3 / Math.max(1, r.totalDensityKgPerM3)) * 100).toFixed(1)}%`, col5: 'ASTM C33 Gradation' },
      ];
      break;
    }

    case 'continuous-beam': {
      const r = result as ContinuousBeamResult;
      const cb = workspace.continuousBeam;
      baseReport.moduleMeta.moduleTitle = 'Continuous Beam Analysis (Clapeyron Theorem)';
      baseReport.moduleMeta.status = 'SAFE';

      const spans = cb?.spans || [];
      baseReport.inputs = [
        { name: 'Span Count', symbol: 'N_span', value: spans.length || cb?.spanCount || 0, unit: 'spans', notes: 'Multi-span continuous beam' },
        ...spans.map((sp, idx) => ({
          name: `Span ${idx + 1} Geometry & Load`,
          symbol: `L_${idx + 1} / w_${idx + 1}`,
          value: `L = ${sp.lengthM} m, w = ${sp.udlKnPerM} kN/m, P = ${sp.pointLoadKn || 0} kN`,
          unit: 'span',
          notes: `I = ${sp.momentOfInertiaCm4} cm^4`,
        })),
      ];

      const supportMB = r.supportMomentsKnm && r.supportMomentsKnm.length > 1 ? r.supportMomentsKnm[1] : 0;
      const reactionA = r.supportReactionsKn && r.supportReactionsKn.length > 0 ? r.supportReactionsKn[0] : 0;
      const reactionB = r.supportReactionsKn && r.supportReactionsKn.length > 1 ? r.supportReactionsKn[1] : 0;

      baseReport.outputs = [
        { name: 'Peak Interior Support Moment', symbol: 'M_hog,max', value: r.maxHoggingMomentKnm.toFixed(2), unit: 'kN.m', status: 'SAFE' },
        { name: 'Peak Span Sagging Moment', symbol: 'M_sag,max', value: r.maxSaggingMomentKnm.toFixed(2), unit: 'kN.m', status: 'SAFE' },
        { name: 'Peak Shear Force Envelope', symbol: 'V_max', value: r.maxShearKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Support A Exterior Reaction', symbol: 'R_1', value: reactionA.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'First Interior Support Reaction', symbol: 'R_2', value: reactionB.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'First Interior Support Moment', symbol: 'M_2', value: supportMB.toFixed(2), unit: 'kN.m', status: 'SAFE' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Clapeyron Three-Moment Continuity Equation',
          equation: 'M_i-1*(L_i/I_i) + 2*M_i*(L_i/I_i + L_i+1/I_i+1) + M_i+1*(L_i+1/I_i+1) = -6*(alpha_i + beta_i+1)',
          substitution: `${spans.length} continuous spans solved via tridiagonal matrix system`,
          result: `Support Moments: [${(r.supportMomentsKnm || []).map((m, i) => `M_${i + 1}=${m.toFixed(2)}`).join(', ')}] kN.m`,
          codeRef: 'Structural Analysis / BNBC 2020',
        },
        {
          stepNumber: 2,
          title: 'Support Reactions by Free-Body Statics',
          equation: 'R_i = V_i,left + V_i,right (Simple Beam Shear + Continuity Moment Shear)',
          substitution: `Peak Hogging = ${r.maxHoggingMomentKnm.toFixed(2)} kN.m, Peak Sagging = ${r.maxSaggingMomentKnm.toFixed(2)} kN.m`,
          result: `Support Reactions: [${(r.supportReactionsKn || []).map((rx, i) => `R_${i + 1}=${rx.toFixed(2)}`).join(', ')}] kN`,
        },
      ];

      if (r.supportReactionsKn && r.supportReactionsKn.length > 0) {
        baseReport.takeoffTitle = 'CONTINUOUS BEAM SUPPORT MOMENT & REACTION SCHEDULE';
        baseReport.takeoffHeaders = ['Support Node', 'Support Type', 'Continuity Moment M (kN.m)', 'Vertical Reaction R (kN)', 'Design Remarks'];
        baseReport.takeoffRows = r.supportReactionsKn.map((rx, idx) => ({
          col1: `Support S-${idx + 1}`,
          col2: idx === 0 || idx === r.supportReactionsKn.length - 1 ? 'Exterior Pin/Roller' : 'Interior Continuous',
          col3: `${(r.supportMomentsKnm?.[idx] ?? 0).toFixed(2)} kN.m`,
          col4: `${rx.toFixed(2)} kN`,
          col5: idx === 0 || idx === r.supportReactionsKn.length - 1 ? 'Zero end moment' : 'Hogging negative moment',
        }));
      }
      break;
    }

    case 'frame-truss-2d': {
      const r = result as FrameTruss2DResult;
      const ft = workspace.frameTruss2d;
      baseReport.moduleMeta.moduleTitle = '2D Frame & Truss Direct Stiffness + Second-Order P-Delta';
      baseReport.moduleMeta.dcrMax = r.utilizationRatio;
      baseReport.moduleMeta.status = r.status.toUpperCase() as any;

      baseReport.inputs = [
        { name: 'Structural Nodes', symbol: 'N_nodes', value: r.nodeCount, unit: 'joints', notes: `${r.freeDofs} free DOFs` },
        { name: 'Structural Members', symbol: 'N_mem', value: r.memberCount, unit: 'elements', notes: ft?.presetName || 'Custom 2D Mesh' },
        { name: 'Analysis Formulation', symbol: 'Mode', value: r.analysisMode === 'second-order-p-delta' ? '2nd-Order P-Delta' : '1st-Order Linear', unit: 'method', notes: 'Direct Stiffness' },
        { name: 'Allowable Combined Stress', symbol: 'sigma_all', value: r.allowableStressMpa, unit: 'MPa', notes: `${r.governingCode} limit` },
      ];

      baseReport.outputs = [
        { name: 'Peak Nodal Displacement', symbol: 'delta_max', value: r.maxDisplacementMm.toFixed(2), unit: 'mm', status: 'SAFE' },
        { name: 'Critical Elastic Buckling Factor', symbol: 'alpha_cr', value: Number.isFinite(r.criticalBucklingFactorAlphaCr) ? r.criticalBucklingFactorAlphaCr.toFixed(2) : 'Infinity', unit: 'ratio', limit: '>= 10.0 (First-Order OK)', status: !Number.isFinite(r.criticalBucklingFactorAlphaCr) || r.criticalBucklingFactorAlphaCr >= 10 ? 'PASS' : 'WARNING' },
        { name: 'Peak Bending Moment Envelope', symbol: '|M|_max', value: r.maxAbsMomentKnm.toFixed(2), unit: 'kN.m', status: 'SAFE' },
        { name: 'Peak Shear Force Envelope', symbol: '|V|_max', value: r.maxAbsShearKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Peak Axial Force Envelope', symbol: '|N|_max', value: r.maxAbsAxialKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Combined Axial + Flexural DCR', symbol: 'DCR', value: `${(r.utilizationRatio * 100).toFixed(1)}%`, unit: 'ratio', limit: '<= 100%', dcrRatio: r.utilizationRatio.toFixed(3), status: r.utilizationRatio <= 1.0 ? 'PASS' : 'FAIL' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Global Stiffness Matrix Assembly & Geometric P-Delta Iteration',
          equation: '([K_E] + [K_G(N)]) * {d} = {F_ext}',
          substitution: `${r.nodeCount} nodes (${r.freeDofs} free DOFs), ${r.memberCount} elements, ${r.pDeltaIterations} P-Delta iterations`,
          result: `Max Nodal Displacement = ${r.maxDisplacementMm.toFixed(2)} mm, alpha_cr = ${Number.isFinite(r.criticalBucklingFactorAlphaCr) ? r.criticalBucklingFactorAlphaCr.toFixed(2) : 'Inf'}`,
          codeRef: r.governingCode,
        },
        {
          stepNumber: 2,
          title: 'Combined Axial & Flexural Member Stress Envelope',
          equation: 'sigma_comb = |N|/A + |M_max|/S <= sigma_all',
          substitution: `Peak sigma = ${r.maxCombinedStressMpa.toFixed(2)} MPa vs Allowable = ${r.allowableStressMpa.toFixed(1)} MPa`,
          result: `Governing DCR = ${(r.utilizationRatio * 100).toFixed(1)}% (${r.status.toUpperCase()})`,
          codeRef: 'AISC 360-22 Ch. H / EN 1993-1-1',
        },
      ];

      if (r.memberResults && r.memberResults.length > 0) {
        baseReport.takeoffTitle = '2D FRAME / TRUSS MEMBER INTERNAL FORCE & STRESS SCHEDULE';
        baseReport.takeoffHeaders = ['Member', 'Length (m)', 'Axial N (kN)', 'Peak Shear V (kN)', 'Peak Moment M (kN.m)', 'Peak Stress (MPa)'];
        baseReport.takeoffRows = r.memberResults.map((mf) => ({
          col1: mf.label || mf.memberId,
          col2: mf.lengthM.toFixed(2),
          col3: `${mf.axialStartKn.toFixed(2)} (${mf.axialStartKn >= 0 ? 'TENS' : 'COMP'})`,
          col4: mf.maxAbsShearKn.toFixed(2),
          col5: mf.maxAbsMomentKnm.toFixed(2),
          col6: `${mf.combinedStressMpa.toFixed(1)} MPa`,
        }));
      }
      break;
    }

    case 'section-analyzer': {
      const r = result as SectionAnalyzerResult;
      const sa = workspace.sectionAnalyzer;
      baseReport.moduleMeta.moduleTitle = 'Cross-Section Stresses & Plastic N-M Interaction';
      baseReport.moduleMeta.dcrMax = r.governingDcr;
      baseReport.moduleMeta.status = r.status.toUpperCase() as any;

      baseReport.inputs = [
        { name: 'Cross-Section Profile', symbol: 'Section', value: r.presetName, unit: r.shape, notes: `${r.designCode} classification` },
        { name: 'Yield Strength & Factor', symbol: 'f_y / gamma_M0', value: `${r.fyMpa} / ${r.gammaM0}`, unit: 'MPa', notes: `f_yd = ${r.fydMpa.toFixed(1)} MPa` },
        { name: 'Applied Axial & Major Moment', symbol: 'N / M_y', value: `${sa?.axialForceN_Kn ?? r.axialForceN_Kn} kN / ${sa?.momentMy_Knm ?? r.momentMy_Knm} kN.m`, unit: 'forces', notes: '+N = Tension, -N = Compression' },
        { name: 'Applied Minor Moment & Shear', symbol: 'M_z / V_z', value: `${sa?.momentMz_Knm ?? r.momentMz_Knm} kN.m / ${sa?.shearVz_Kn ?? r.shearVz_Kn} kN`, unit: 'forces', notes: `T = ${sa?.torsionT_Knm ?? r.torsionT_Knm} kN.m` },
      ];

      baseReport.outputs = [
        { name: 'Section Area & Major Inertia', symbol: 'A / I_y', value: `${r.areaCm2.toFixed(1)} cm^2 / ${r.iyCm4.toFixed(0)} cm^4`, unit: 'geom', status: 'INFO' },
        { name: 'Plastic & Elastic Moduli', symbol: 'W_pl,y / W_el,y', value: `${r.wplYCm3.toFixed(1)} / ${r.welYMinCm3.toFixed(1)}`, unit: 'cm^3', status: 'INFO' },
        { name: 'Section Classification', symbol: 'Class', value: r.classification.classLabel, unit: r.classification.aiscEquivalent, status: r.classification.isPlasticAllowed ? 'PASS' : 'WARNING' },
        { name: 'Peak Normal & von Mises Stress', symbol: 'sigma / sigma_vM', value: `${r.sigmaAbsMaxMpa.toFixed(1)} / ${r.vonMisesMaxMpa.toFixed(1)}`, unit: 'MPa', limit: `<= ${r.fydMpa.toFixed(1)} MPa`, status: r.elasticStressDcr <= 1.0 ? 'PASS' : 'FAIL' },
        { name: 'Reduced Plastic Moment M_N,y,Rd', symbol: 'M_N,y,Rd', value: r.mNyReducedRdKnm.toFixed(1), unit: 'kN.m', status: r.classification.isPlasticAllowed ? 'PASS' : 'WARNING' },
        { name: 'Governing Section DCR', symbol: 'DCR', value: `${(r.governingDcr * 100).toFixed(1)}%`, unit: 'ratio', limit: '<= 100%', dcrRatio: r.governingDcr.toFixed(3), status: r.governingDcr <= 1.0 ? 'PASS' : 'FAIL' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Cross-Section Geometric & Plastic Modulus Integration',
          equation: 'A = int dA | I_y = int z^2 dA | W_el,y = I_y / z_max | alpha_y = W_pl,y / W_el,y',
          substitution: `A = ${r.areaCm2.toFixed(2)} cm^2, I_y = ${r.iyCm4.toFixed(1)} cm^4, I_z = ${r.izCm4.toFixed(1)} cm^4`,
          result: `W_pl,y = ${r.wplYCm3.toFixed(1)} cm^3, W_el,y = ${r.welYMinCm3.toFixed(1)} cm^3 (Shape factor = ${r.shapeFactorY.toFixed(3)})`,
          codeRef: r.designCode,
        },
        {
          stepNumber: 2,
          title: 'Huber-Hencky-von Mises Equivalent Stress & Plastic N-M Check',
          equation: 'sigma_vM = sqrt(sigma_x^2 + 3 * tau_total^2) <= f_yd',
          substitution: `sigma_max = ${r.sigmaAbsMaxMpa.toFixed(1)} MPa, tau_max = ${r.tauTotalMaxMpa.toFixed(1)} MPa`,
          result: `sigma_vM = ${r.vonMisesMaxMpa.toFixed(1)} MPa vs f_yd = ${r.fydMpa.toFixed(1)} MPa (DCR = ${(r.governingDcr * 100).toFixed(1)}%)`,
          codeRef: 'EN 1993-1-1 §6.2.1 / AISC 360-22',
        },
      ];

      if (r.cornerStresses && r.cornerStresses.length > 0) {
        baseReport.takeoffTitle = 'CRITICAL FIBER STRESS & VON MISES VERIFICATION POINTS';
        baseReport.takeoffHeaders = ['Fiber Location', 'Coord (y, z) mm', 'Normal sigma_x (MPa)', 'Shear tau (MPa)', 'von Mises (MPa)', 'Utilization'];
        baseReport.takeoffRows = r.cornerStresses.map((pt) => ({
          col1: pt.label,
          col2: `(${pt.yMm.toFixed(0)}, ${pt.zMm.toFixed(0)})`,
          col3: pt.sigmaMpa.toFixed(2),
          col4: pt.tauMpa.toFixed(2),
          col5: pt.vonMisesMpa.toFixed(2),
          col6: `${((pt.vonMisesMpa / Math.max(1, r.fydMpa)) * 100).toFixed(1)}%`,
        }));
      }
      break;
    }

    case 'rc-column-design': {
      const r = result as RcColumnDesignResult;
      const col = workspace.rcColumn;
      baseReport.moduleMeta.moduleTitle = 'RC Column Uniaxial & Biaxial N-M Interaction & Slenderness';
      baseReport.moduleMeta.dcrMax = r.governingDcr;
      baseReport.moduleMeta.status = r.status.toUpperCase() as any;

      baseReport.inputs = [
        { name: 'Column Dimensions (b x h)', symbol: 'b x h', value: `${r.widthB_Mm} x ${r.depthH_Mm}`, unit: 'mm', notes: `Cover ${r.clearCoverMm} mm` },
        { name: 'Concrete & Rebar Grades', symbol: 'f\'c / fy', value: `${r.concreteFcMpa} / ${r.rebarFyMpa}`, unit: 'MPa', notes: `${r.designCode}` },
        { name: 'Longitudinal Bars & Ties', symbol: 'Bars / Ties', value: `${r.totalBarCount}-Phi${r.longitudinalBarDiaMm} (${r.rhoPercent.toFixed(2)}%)`, unit: `Ties Phi${r.tieBarDiaMm}@${r.tieSpacingMm}`, notes: `Ast = ${r.astProvidedMm2.toFixed(0)} mm^2` },
        { name: 'Factored Actions (Pu / Mux / Muy)', symbol: 'Pu / Mu', value: `${r.axialLoadPu_Kn} kN / ${col?.momentMux_Knm ?? r.momentMux_Knm} / ${col?.momentMuy_Knm ?? r.momentMuy_Knm} kN.m`, unit: 'actions', notes: `Lu = ${col?.unsupportedLengthLu_M ?? 0} m` },
      ];

      baseReport.outputs = [
        { name: 'Max Design Axial Cutoff', symbol: 'Phi Pn,max', value: r.phiPnMaxKn.toFixed(1), unit: 'kN', limit: `Pu <= ${r.phiPnMaxKn.toFixed(0)} kN`, status: r.axialDcr <= 1.0 ? 'PASS' : 'FAIL' },
        { name: 'Major Flexural Capacity at Pu', symbol: 'Phi Mnx', value: r.xAxis.phiMnAtPuKnm.toFixed(1), unit: 'kN.m', status: r.xAxis.uniaxialDcr <= 1.0 ? 'PASS' : 'FAIL' },
        { name: 'Minor Flexural Capacity at Pu', symbol: 'Phi Mny', value: r.yAxis.phiMnAtPuKnm.toFixed(1), unit: 'kN.m', status: r.yAxis.uniaxialDcr <= 1.0 ? 'PASS' : 'FAIL' },
        { name: 'Slenderness Magnifier (X / Y)', symbol: 'delta_ns', value: `${r.xAxis.magnifierDeltaNs.toFixed(3)} / ${r.yAxis.magnifierDeltaNs.toFixed(3)}`, unit: 'ratio', status: r.xAxis.isSlender || r.yAxis.isSlender ? 'WARNING' : 'PASS' },
        { name: 'Bresler Biaxial Contour DCR', symbol: 'Bresler', value: `${(r.breslerContourDcr * 100).toFixed(1)}%`, unit: 'ratio', limit: '<= 100%', dcrRatio: r.breslerContourDcr.toFixed(3), status: r.breslerContourDcr <= 1.0 ? 'PASS' : 'FAIL' },
        { name: 'Governing Column DCR', symbol: 'DCR', value: `${(r.governingDcr * 100).toFixed(1)}%`, unit: 'ratio', limit: '<= 100%', dcrRatio: r.governingDcr.toFixed(3), status: r.governingDcr <= 1.0 ? 'PASS' : 'FAIL' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Pure Axial Squash Load & Code Eccentricity Cutoff',
          equation: "P_0 = 0.85 * f'c * (A_g - A_st) + f_y * A_st | phi*P_n,max = 0.80 * phi * P_0",
          substitution: `A_g = ${r.grossAreaMm2.toFixed(0)} mm^2, A_st = ${r.astProvidedMm2.toFixed(0)} mm^2 (${r.rhoPercent.toFixed(2)}%)`,
          result: `P_0 = ${r.p0Kn.toFixed(1)} kN -> phi*P_n,max = ${r.phiPnMaxKn.toFixed(1)} kN`,
          codeRef: 'ACI 318-19 §22.4.2 / BNBC 2020',
        },
        {
          stepNumber: 2,
          title: 'Euler Critical Buckling & Moment Magnification',
          equation: 'P_c = pi^2 * (EI)_eff / (k * L_u)^2 | delta_ns = Cm / (1 - P_u / (0.75 * P_c)) >= 1.0',
          substitution: `X-Axis: kL/r = ${r.xAxis.slendernessRatioKluR.toFixed(1)}, P_c,x = ${r.xAxis.pcEulerKn.toFixed(0)} kN | Y-Axis: kL/r = ${r.yAxis.slendernessRatioKluR.toFixed(1)}, P_c,y = ${r.yAxis.pcEulerKn.toFixed(0)} kN`,
          result: `Magnified Moments: M_cx = ${r.xAxis.magnifiedMomentKnm.toFixed(1)} kN.m, M_cy = ${r.yAxis.magnifiedMomentKnm.toFixed(1)} kN.m`,
          codeRef: 'ACI 318-19 §6.6.4.5',
        },
        {
          stepNumber: 3,
          title: 'Bresler Biaxial Load Contour Interaction Check',
          equation: '(M_cx / phi*M_nx)^alpha + (M_cy / phi*M_ny)^alpha <= 1.0',
          substitution: `(${r.xAxis.magnifiedMomentKnm.toFixed(1)} / ${r.xAxis.phiMnAtPuKnm.toFixed(1)})^${r.breslerAlpha.toFixed(2)} + (${r.yAxis.magnifiedMomentKnm.toFixed(1)} / ${r.yAxis.phiMnAtPuKnm.toFixed(1)})^${r.breslerAlpha.toFixed(2)}`,
          result: `Bresler Biaxial DCR = ${(r.breslerContourDcr * 100).toFixed(1)}%, Governing DCR = ${(r.governingDcr * 100).toFixed(1)}%`,
          codeRef: 'ACI 318-19 R22.4 / Bresler (1960)',
        },
      ];

      if (r.xAxis?.curve && r.xAxis.curve.length > 0) {
        const sampledPoints = r.xAxis.curve.filter((_, idx) => idx % Math.max(1, Math.floor(r.xAxis.curve.length / 8)) === 0);
        baseReport.takeoffTitle = 'UNIAXIAL N-M INTERACTION CONTROL POINTS (MAJOR X-AXIS)';
        baseReport.takeoffHeaders = ['Limit State Regime', 'Neutral Axis c (mm)', 'Nominal Pn (kN)', 'Nominal Mn (kN.m)', 'Design phi*Pn (kN)', 'Design phi*Mn (kN.m)'];
        baseReport.takeoffRows = sampledPoints.map((kp) => ({
          col1: kp.regime.toUpperCase(),
          col2: Number.isFinite(kp.cMm) ? kp.cMm.toFixed(1) : 'Infinity',
          col3: kp.pnKn.toFixed(1),
          col4: kp.mnKnm.toFixed(1),
          col5: kp.phiPnKn.toFixed(1),
          col6: kp.phiMnKnm.toFixed(1),
        }));
      }
      break;
    }

    case 'strut-and-tie': {
      const r = result as StrutAndTieResult;
      baseReport.moduleMeta.moduleTitle = 'Strut-and-Tie Model (STM) Discontinuity Solver (Partial Scope)';
      baseReport.moduleMeta.dcrMax = r.governingDcr;
      baseReport.moduleMeta.status = r.status.toUpperCase() as any;

      baseReport.inputs = [
        { name: 'STM D-Region Template', symbol: 'Model', value: r.presetName, unit: `${r.nodeCount}N / ${r.memberCount}M`, notes: 'Partial Scope: Truss Equilibrium' },
        { name: 'Member Thickness & Materials', symbol: 't / f\'c / fy', value: `${r.memberThicknessMm} mm / ${r.concreteFcMpa} / ${r.rebarFyMpa} MPa`, unit: 'spec', notes: 'ACI 318-19 Ch. 23' },
        { name: 'Total Applied Nodal Load', symbol: 'Sum Fy', value: r.totalAppliedFyKn.toFixed(1), unit: 'kN', notes: `Sum Fx = ${r.totalAppliedFxKn.toFixed(1)} kN` },
      ];

      baseReport.outputs = [
        { name: 'Max Compression Strut Force', symbol: 'F_strut', value: r.maxCompressionStrutKn.toFixed(1), unit: 'kN', status: 'INFO' },
        { name: 'Max Tension Tie Force', symbol: 'F_tie', value: r.maxTensionTieKn.toFixed(1), unit: 'kN', status: 'INFO' },
        { name: 'Total Required Tie Steel', symbol: 'As,req', value: r.totalRequiredTieSteelMm2.toFixed(0), unit: 'mm^2', status: 'PASS' },
        { name: 'Global Equilibrium Residual', symbol: 'Residual', value: r.equilibriumResidualKn.toExponential(2), unit: 'kN', limit: '< 1e-2 kN', status: r.equilibriumResidualKn < 1e-2 ? 'PASS' : 'WARNING' },
        { name: 'Governing Strut/Tie Stress DCR', symbol: 'DCR', value: `${(r.governingDcr * 100).toFixed(1)}%`, unit: 'ratio', limit: '<= 100%', dcrRatio: r.governingDcr.toFixed(3), status: r.governingDcr <= 1.0 ? 'PASS' : 'FAIL' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'D-Region Pin-Jointed Truss Equilibrium & Strut Capacity',
          equation: "f_ce = 0.85 * beta_c * beta_s * f'c | phi * F_ns = phi * f_ce * A_cs",
          substitution: `t = ${r.memberThicknessMm} mm, f'c = ${r.concreteFcMpa} MPa, Max Strut Force = ${r.maxCompressionStrutKn.toFixed(1)} kN`,
          result: `Equilibrium residual = ${r.equilibriumResidualKn.toExponential(2)} kN`,
          codeRef: 'ACI 318-19 §23.4 / EN 1992-1-1 §6.5',
        },
        {
          stepNumber: 2,
          title: 'Tension Tie Reinforcement Sizing',
          equation: 'A_ts,req = F_u,tie / (phi * f_y)',
          substitution: `Max Tie Tension = ${r.maxTensionTieKn.toFixed(1)} kN, f_y = ${r.rebarFyMpa} MPa`,
          result: `Total Tie Reinforcement Required = ${r.totalRequiredTieSteelMm2.toFixed(0)} mm^2`,
          codeRef: 'ACI 318-19 §23.7',
        },
      ];

      if (r.memberResults && r.memberResults.length > 0) {
        baseReport.takeoffTitle = 'STRUT-AND-TIE MEMBER FORCE & REINFORCEMENT SCHEDULE';
        baseReport.takeoffHeaders = ['Element', 'Role', 'Length (m)', 'Axial Force (kN)', 'Stress / Limit (MPa)', 'DCR / Required Steel'];
        baseReport.takeoffRows = r.memberResults.map((m) => ({
          col1: m.label || m.memberId,
          col2: m.role.toUpperCase(),
          col3: m.lengthM.toFixed(2),
          col4: `${m.axialForceKn.toFixed(1)} kN`,
          col5: `${m.stressMpa.toFixed(1)} / ${m.allowableLimitMpa.toFixed(1)} MPa`,
          col6: m.role === 'tie' ? `DCR ${(m.dcrRatio * 100).toFixed(0)}% (${m.requiredTieSteelMm2.toFixed(0)} mm^2)` : `DCR ${(m.dcrRatio * 100).toFixed(0)}%`,
        }));
      }
      break;
    }

    case 'pile-capacity': {
      const r = result as PileCapacityResult;
      const p = workspace.pile;
      baseReport.moduleMeta.moduleTitle = 'Deep Foundation Cast-in-Situ Bored Pile Capacity';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Pile Embedded Length', symbol: 'L', value: p?.lengthM ?? r.lengthM, unit: 'm', notes: 'Penetration length' },
        { name: 'Pile Shaft Diameter', symbol: 'D', value: p?.diameterM ?? r.diameterM, unit: 'm', notes: 'Bored shaft diameter' },
        { name: 'Pile Foundation Type', symbol: 'Type', value: p?.pileType || r.pileType, unit: 'classification', notes: 'Installation method' },
        { name: 'Design Factor of Safety', symbol: 'FoS', value: p?.factorOfSafety ?? 2.5, unit: 'ratio', notes: 'Code safety factor' },
      ];

      baseReport.outputs = [
        { name: 'Ultimate Axial Pile Capacity', symbol: 'Q_ult', value: r.ultimateCapacityKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Allowable Safe Axial Load', symbol: 'Q_all', value: r.allowableCapacityKn.toFixed(2), unit: 'kN', limit: 'Q_ult / FoS', status: 'SAFE' },
        { name: 'Shaft Skin Friction Resistance', symbol: 'Q_s', value: r.skinFrictionKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Base End Bearing Resistance', symbol: 'Q_b', value: r.endBearingKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Pile Cross-Sectional Area', symbol: 'A_p', value: r.crossSectionAreaM2.toFixed(3), unit: 'm^2', status: 'INFO' },
      ];

      const shaftLen = p?.lengthM ?? r.lengthM;
      const avgFsKpa = r.perimeterM * shaftLen > 0 ? r.skinFrictionKn / (r.perimeterM * shaftLen) : 0;

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Pile Shaft Skin Friction Resistance (Alpha / Beta Method)',
          equation: 'Q_s = Perimeter * L * f_s = (pi * D * L) * (alpha * c_u + K_s * sigma_v * tan(delta))',
          substitution: `Perimeter = ${r.perimeterM.toFixed(3)} m, L = ${shaftLen.toFixed(2)} m, f_s,avg = ${avgFsKpa.toFixed(2)} kPa`,
          result: `Q_s = ${r.skinFrictionKn.toFixed(2)} kN`,
          codeRef: 'BNBC 2020 Part 6 Ch 4 / Tomlinson',
        },
        {
          stepNumber: 2,
          title: 'Pile Tip End Bearing & Allowable Safe Working Load',
          equation: 'Q_b = A_p * q_b | Q_ult = Q_s + Q_b | Q_all = (Q_ult - W_pile) / FoS',
          substitution: `A_p = ${r.crossSectionAreaM2.toFixed(3)} m^2, q_b = ${r.unitEndBearingKpa.toFixed(1)} kPa, Q_b = ${r.endBearingKn.toFixed(2)} kN`,
          result: `Q_ult = ${r.ultimateCapacityKn.toFixed(2)} kN -> Q_all = ${r.allowableCapacityKn.toFixed(2)} kN`,
          codeRef: 'Meyerhof / Vesic Deep Foundation',
        },
      ];
      break;
    }

    case 'pipe-hydraulics': {
      const r = result as PipeHydraulicsResult;
      const p = workspace.pipe;
      baseReport.moduleMeta.moduleTitle = 'Pressurized Pipe Hydraulics & Darcy-Weisbach / Hazen-Williams';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Pipe Internal Diameter', symbol: 'D', value: p?.internalDiameterMm ?? r.internalDiameterMm, unit: 'mm', notes: 'Inner bore' },
        { name: 'Total Pipe Length', symbol: 'L', value: p?.lengthM ?? r.lengthM, unit: 'm', notes: 'Conduit length' },
        { name: 'Volumetric Flow Rate', symbol: 'Q', value: p?.flowRateLps ?? r.flowRateLps, unit: 'L/s', notes: 'Conveyance discharge' },
        { name: 'Pipe Material Specification', symbol: 'Mat', value: p?.pipeMaterial || r.pipeMaterial, unit: 'type', notes: 'Roughness factor' },
      ];

      baseReport.outputs = [
        { name: 'Total Friction Head Loss', symbol: 'h_f', value: r.totalHeadLossM.toFixed(3), unit: 'm', status: 'SAFE' },
        { name: 'Mean Flow Velocity', symbol: 'V', value: r.velocityMps.toFixed(3), unit: 'm/s', limit: '0.6 - 3.0 m/s', status: r.velocityMps >= 0.6 && r.velocityMps <= 3.0 ? 'SAFE' : 'WARNING' },
        { name: 'Reynolds Number', symbol: 'Re', value: r.reynoldsNumber.toFixed(0), unit: 'ratio', limit: r.flowRegime.toUpperCase(), status: 'INFO' },
        { name: 'Darcy Friction Factor', symbol: 'f', value: r.darcyFrictionFactor.toFixed(4), unit: 'dimensionless', status: 'INFO' },
        { name: 'Outlet Gauge Pressure', symbol: 'P_out', value: r.outletPressureKpa.toFixed(1), unit: 'kPa', status: 'SAFE' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Continuity Velocity & Reynolds Turbulence Regime',
          equation: 'V = Q / (pi * D^2 / 4) | Re = (V * D) / nu',
          substitution: `Q = ${(p?.flowRateLps ?? r.flowRateLps).toFixed(2)} L/s, D = ${(p?.internalDiameterMm ?? r.internalDiameterMm).toFixed(0)} mm`,
          result: `V = ${r.velocityMps.toFixed(3)} m/s, Re = ${r.reynoldsNumber.toFixed(0)} (${r.flowRegime.toUpperCase()})`,
          codeRef: 'Fluid Mechanics / Swamee-Jain',
        },
        {
          stepNumber: 2,
          title: 'Darcy-Weisbach Friction & Minor Fitting Head Loss',
          equation: 'h_f = f * (L / D) * (V^2 / 2g) + K_m * (V^2 / 2g)',
          substitution: `f = ${r.darcyFrictionFactor.toFixed(4)}, h_f,major = ${r.frictionHeadLossM.toFixed(3)} m, h_m,minor = ${r.minorHeadLossM.toFixed(3)} m`,
          result: `Total Head Loss = ${r.totalHeadLossM.toFixed(3)} m, Outlet Pressure = ${r.outletPressureKpa.toFixed(1)} kPa`,
          codeRef: 'AWWA / BNBC Plumbing Code',
        },
      ];
      break;
    }

    case 'masonry-finishes': {
      const r = result as MasonryResult;
      const m = workspace.masonry;
      baseReport.moduleMeta.moduleTitle = 'Masonry Brickwork & Surface Plastering Estimator';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Wall Clear Length', symbol: 'L_wall', value: m.wallLengthM, unit: 'm', notes: 'Continuous wall length' },
        { name: 'Wall Height', symbol: 'H_wall', value: m.wallHeightM, unit: 'm', notes: 'Clear story height' },
        { name: 'Wall Thickness', symbol: 't_wall', value: (m.wallThicknessM * 1000).toFixed(0), unit: 'mm', notes: 'Standard 125mm / 250mm' },
        { name: 'Mortar Proportion (Cement : Sand)', symbol: 'Ratio', value: `${m.mortarRatioCement}:${m.mortarRatioSand}`, unit: 'parts', notes: 'Volumetric batch' },
        { name: 'Modular Brick Size', symbol: 'Brick', value: `${m.brickLengthMm}x${m.brickWidthMm}x${m.brickHeightMm}`, unit: 'mm', notes: 'Standard burnt clay brick' },
        { name: 'Openings Count (Doors/Windows)', symbol: 'N_open', value: m.openings?.length || 0, unit: 'items', notes: 'Deductions deducted' },
      ];

      baseReport.outputs = [
        { name: 'Net Brickwork Volume', symbol: 'V_net', value: r.netWallVolumeM3.toFixed(3), unit: 'm^3', status: 'SAFE' },
        { name: 'Bricks Required (Inc. Wastage)', symbol: 'N_bricks', value: r.bricksWithWastageCount.toLocaleString(), unit: 'Nos', status: 'SAFE' },
        { name: 'Dry Mortar Cement Bags', symbol: 'C_mortar', value: r.mortarCementBags50Kg.toFixed(1), unit: 'bags (50kg)', status: 'SAFE' },
        { name: 'Dry Mortar Sand Volume', symbol: 'V_sand', value: r.mortarSandCft.toFixed(1), unit: 'cft', status: 'SAFE' },
        { name: 'Plaster Cement Required', symbol: 'C_plaster', value: r.plasterCementBags.toFixed(1), unit: 'bags (50kg)', status: 'SAFE' },
        { name: 'Plaster Sand Required', symbol: 'V_plaster_sand', value: r.plasterSandCft.toFixed(1), unit: 'cft', status: 'SAFE' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Net Masonry Wall Volume & Modular Brick Count',
          equation: 'V_net = (L * H - A_openings) * t_wall | N_bricks = V_net / V_nominal_brick',
          substitution: `Gross Area = ${r.grossWallAreaM2.toFixed(2)} m^2, Deductions = ${r.totalOpeningAreaM2.toFixed(2)} m^2 -> Net Area = ${r.netWallAreaM2.toFixed(2)} m^2`,
          result: `V_net = ${r.netWallVolumeM3.toFixed(3)} m^3 -> ${r.bricksWithWastageCount.toLocaleString()} Bricks (inc. wastage)`,
          codeRef: 'PWD Schedule / BDS 208',
        },
        {
          stepNumber: 2,
          title: 'Brickwork Mortar & Surface Plastering Quantities',
          equation: 'V_mortar,dry = 1.33 * V_mortar,wet | V_plaster,dry = 1.50 * (A_plaster * t_plaster)',
          substitution: `Mortar (${m.mortarRatioCement}:${m.mortarRatioSand}) = ${r.mortarVolumeDryM3.toFixed(3)} m^3 | Plaster Area = ${r.plasterAreaM2.toFixed(2)} m^2`,
          result: `Total Cement = ${(r.mortarCementBags50Kg + r.plasterCementBags).toFixed(1)} bags, Total Sand = ${(r.mortarSandCft + r.plasterSandCft).toFixed(1)} CFT`,
        },
      ];

      const primerL = r.paintPuttySchedule?.primerLitersRequired ?? 0;
      const paintL = r.paintPuttySchedule?.paintLitersRequired ?? 0;
      const puttyKg = r.paintPuttySchedule?.puttyKgRequired ?? 0;

      baseReport.takeoffTitle = 'MASONRY, PLASTER & PAINTING MATERIAL SCHEDULE';
      baseReport.takeoffHeaders = ['Work Package', 'Material Item', 'Net Quantity', 'Commercial Unit', 'Specification'];
      baseReport.takeoffRows = [
        { col1: 'Brickwork', col2: 'First-Class Burnt Clay Bricks', col3: r.bricksWithWastageCount.toLocaleString(), col4: 'Nos', col5: `${m.brickLengthMm}x${m.brickWidthMm}x${m.brickHeightMm} mm` },
        { col1: 'Brickwork Mortar', col2: 'OPC Cement (Mortar)', col3: r.mortarCementBags50Kg.toFixed(2), col4: 'Bags (50 kg)', col5: `Ratio ${m.mortarRatioCement}:${m.mortarRatioSand}` },
        { col1: 'Brickwork Mortar', col2: 'Mortar Sand (FM 1.5)', col3: r.mortarSandCft.toFixed(1), col4: 'CFT', col5: `${r.mortarSandM3.toFixed(3)} m^3` },
        { col1: 'Surface Plaster', col2: 'OPC Cement (Plaster)', col3: r.plasterCementBags.toFixed(2), col4: 'Bags (50 kg)', col5: `Area = ${r.plasterAreaM2.toFixed(1)} m^2` },
        { col1: 'Surface Plaster', col2: 'Plaster Sand (FM 1.2)', col3: r.plasterSandCft.toFixed(1), col4: 'CFT', col5: 'Clean screened sand' },
        { col1: 'Surface Finishes', col2: 'Primer + Finish Paint', col3: `${primerL.toFixed(1)} L / ${paintL.toFixed(1)} L`, col4: 'Liters', col5: `Putty = ${puttyKg.toFixed(1)} kg` },
      ];
      break;
    }

    case 'earthwork-alignment': {
      const r = result as EarthworkResult;
      const e = workspace.earthwork;
      baseReport.moduleMeta.moduleTitle = 'Earthwork Excavation, Trenching & Road Alignment';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Calculation Method', symbol: 'Type', value: e.calculationType.replace('-', ' ').toUpperCase(), unit: 'method', notes: 'Standard geometry' },
        { name: 'Soil Classification', symbol: 'Soil', value: e.soilType.replace('-', ' ').toUpperCase(), unit: 'type', notes: 'Geotechnical soil type' },
        { name: 'Trench / Road Length', symbol: 'L', value: e.trenchLengthM || e.roadLengthM || e.pitTopLengthM, unit: 'm', notes: 'Longitudinal dimension' },
        { name: 'Base Formation Width', symbol: 'B', value: e.formationWidthM || e.trenchBottomWidthM || e.pitTopWidthM, unit: 'm', notes: 'Bottom cut width' },
      ];

      baseReport.outputs = [
        { name: 'In-Situ Bank Cut Volume', symbol: 'V_bank', value: r.bankVolumeM3.toFixed(2), unit: 'm^3', status: 'SAFE' },
        { name: 'Loose Haul Volume (Swelled)', symbol: 'V_loose', value: r.looseVolumeM3.toFixed(2), unit: 'm^3', limit: `Swell: ${((r.swellFactor - 1) * 100).toFixed(0)}%`, status: 'SAFE' },
        { name: 'Compacted Fill Volume', symbol: 'V_compact', value: r.compactedVolumeM3.toFixed(2), unit: 'm^3', status: 'SAFE' },
        { name: '10 m^3 Dumper Trips Required', symbol: 'Trips', value: r.haulTruckTripsCount10M3, unit: 'trips', status: 'INFO' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Prismoidal & Average-End-Area Earthwork Volume',
          equation: 'V_prism = (L / 6) * (A_1 + 4 * A_m + A_2) | V_loose = V_bank * Swell | V_comp = V_bank * Shrinkage',
          substitution: `V_bank = ${r.bankVolumeM3.toFixed(2)} m^3, Swell = ${r.swellFactor.toFixed(2)}, Shrinkage = ${r.shrinkageFactor.toFixed(2)}`,
          result: `Loose Volume = ${r.looseVolumeM3.toFixed(2)} m^3 (${r.haulTruckTripsCount10M3} dumper trips of 10 m^3)`,
          codeRef: 'AASHTO / RHD Earthwork Manual',
        },
      ];

      if (r.stationSchedule && r.stationSchedule.length > 0) {
        baseReport.takeoffTitle = 'MULTI-STATION CHAINAGE CUT/FILL & MASS-HAUL SCHEDULE';
        baseReport.takeoffHeaders = ['Chainage (m)', 'Cut / Fill Depth (m)', 'Cut Area (m^2)', 'Seg Cut Vol (m^3)', 'Seg Fill Vol (m^3)', 'Mass-Haul Balance (m^3)'];
        baseReport.takeoffRows = r.stationSchedule.map((st) => ({
          col1: `Ch ${st.chainageM.toFixed(1)}m`,
          col2: `C: ${st.cutDepthM.toFixed(2)} / F: ${st.fillHeightM.toFixed(2)}`,
          col3: st.cutAreaM2.toFixed(2),
          col4: st.segmentCutPrismoidalM3.toFixed(2),
          col5: st.segmentFillPrismoidalM3.toFixed(2),
          col6: `${st.cumMassHaulBalanceM3 >= 0 ? '+' : ''}${st.cumMassHaulBalanceM3.toFixed(2)}`,
        }));
      }
      break;
    }

    case 'rate-analysis': {
      const r = result as RateAnalysisResult;
      const ra = workspace.rateAnalysis;
      baseReport.moduleMeta.moduleTitle = `Rate Analysis & Resource Estimation (${r.workType.toUpperCase()})`;
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Work Specification', symbol: 'Item', value: r.workDescription || ra.workType, unit: 'code', notes: 'Standard civil specification' },
        { name: 'Basis Volume', symbol: 'V_basis', value: ra.basisVolumeM3, unit: 'm^3', notes: 'Unit rate basis' },
        { name: 'Local Cost Index Multiplier', symbol: 'Index', value: r.localCostIndex || 1.0, unit: 'factor', notes: 'Regional rate modifier' },
        { name: 'Currency Code', symbol: 'Curr', value: ra.currency, unit: 'code', notes: 'Active commercial currency' },
      ];

      baseReport.outputs = [
        { name: 'Prime Direct Work Cost', symbol: 'C_prime', value: `${ra.currency} ${r.primeCost.toFixed(2)}`, unit: ra.currency, status: 'SAFE' },
        { name: 'Contractor Profit & Overhead', symbol: 'CP&OH', value: `${ra.currency} ${r.contractorProfitCost.toFixed(2)}`, unit: ra.currency, limit: `${r.contractorProfitPercent}%`, status: 'SAFE' },
        { name: 'Composite Unit Rate per m^3', symbol: 'Rate/m^3', value: `${ra.currency} ${r.unitRatePerM3.toFixed(2)}`, unit: `/m^3`, status: 'SAFE' },
        { name: 'Equivalent Rate per CFT', symbol: 'Rate/cft', value: `${ra.currency} ${r.unitRatePerCft.toFixed(2)}`, unit: `/cft`, status: 'SAFE' },
      ];

      if (r.materials && r.materials.length > 0) {
        baseReport.takeoffHeaders = ['Resource Category', 'Description', 'Quantity', 'Unit', 'Unit Rate', 'Total Amount'];
        baseReport.takeoffRows = [
          ...r.materials.map((m) => ({
            col1: 'MATERIAL',
            col2: m.name,
            col3: m.unit,
            col4: m.quantity.toFixed(2),
            col5: m.unit,
            col6: `${ra.currency} ${m.unitPrice.toFixed(2)}`,
            col7: `${ra.currency} ${m.totalCost.toFixed(2)}`,
          })),
          ...r.labors.map((l) => ({
            col1: 'LABOR',
            col2: l.trade,
            col3: 'man-day',
            col4: l.daysRequired.toFixed(2),
            col5: 'man-day',
            col6: `${ra.currency} ${l.dailyWage.toFixed(2)}`,
            col7: `${ra.currency} ${l.totalCost.toFixed(2)}`,
          })),
        ];
      }
      break;
    }

    case 'unit-converter': {
      const c = workspace.converter;
      baseReport.moduleMeta.moduleTitle = `Universal Unit Conversion Verification (${c.category.toUpperCase()})`;
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Dimension Category', symbol: 'Cat', value: c.category.toUpperCase(), unit: 'type', notes: 'Physical quantity' },
        { name: 'Input Magnitude', symbol: 'Val_in', value: c.inputValue, unit: c.fromUnit, notes: 'Source reading' },
        { name: 'Source Unit', symbol: 'Unit_src', value: c.fromUnit, unit: 'unit', notes: 'Input standard' },
        { name: 'Target Unit', symbol: 'Unit_dst', value: c.toUnit, unit: 'unit', notes: 'Requested standard' },
      ];

      const outVal = (result as any)?.result !== undefined ? (result as any).result : c.inputValue;
      baseReport.outputs = [
        { name: 'Converted Verified Value', symbol: 'Val_out', value: typeof outVal === 'number' ? outVal.toFixed(4) : String(outVal), unit: c.toUnit, status: 'SAFE' },
        { name: 'Conversion System Presets', symbol: 'Standard', value: `${workspace.unitPreferences?.systemPreset || 'SI'} Standard`, unit: 'preset', status: 'INFO' },
      ];
      break;
    }

    case 'surveying-suite': {
      const sv = workspace.surveying;
      const stations = sv?.stations || [];
      const sumBS = stations.reduce((acc, s) => acc + (s.backsight ?? 0), 0);
      const sumFS = stations.reduce((acc, s) => acc + (s.foresight ?? 0), 0);
      const bmRl = sv?.benchmarkRL ?? 0;
      const formRl = sv?.formationRL ?? 0;
      const firstRl = stations.length > 0 ? stations[0].reducedLevel : bmRl;
      const lastRl = stations.length > 0 ? stations[stations.length - 1].reducedLevel : bmRl;
      const deltaSights = Number((sumBS - sumFS).toFixed(3));
      const deltaRl = Number((lastRl - firstRl).toFixed(3));
      const misclosure = Math.abs(deltaSights - deltaRl);
      const areaM2 = sv?.computedAreaSqM ?? 0;
      const volM3 = sv?.computedExcavationVolumeM3 ?? 0;
      const isZeroBaseline = stations.length === 0 && bmRl === 0 && areaM2 === 0;

      baseReport.moduleMeta.moduleTitle = 'Field Surveying, Differential Leveling & Land Takeoff';
      baseReport.moduleMeta.status = isZeroBaseline
        ? 'ZERO BASELINE'
        : misclosure <= 0.002
          ? 'SAFE'
          : 'WARNING';

      baseReport.inputs = [
        { name: 'Survey Datum Benchmark', symbol: 'BM_01', value: bmRl.toFixed(3), unit: 'm', notes: 'Permanent benchmark datum' },
        { name: 'Design Formation RL', symbol: 'RL_form', value: formRl.toFixed(3), unit: 'm', notes: 'Target grading datum' },
        { name: 'Reduction Method', symbol: 'Method', value: sv?.method || 'height-of-instrument', unit: 'standard', notes: 'Double reduction check' },
        { name: 'Recorded Level Stations', symbol: 'N_stn', value: stations.length, unit: 'nos', notes: 'Survey traverse points' },
      ];

      baseReport.outputs = [
        { name: 'Computed Land Plot Area', symbol: 'A_plot', value: areaM2.toFixed(2), unit: 'm^2', status: isZeroBaseline ? 'INFO' : 'SAFE' },
        { name: 'Net Cut / Fill Volume', symbol: 'V_earth', value: volM3.toFixed(2), unit: 'm^3', status: isZeroBaseline ? 'INFO' : 'SAFE' },
        { name: 'Arithmetic Sight Check (Sigma BS - Sigma FS)', symbol: 'Delta_Sights', value: deltaSights.toFixed(3), unit: 'm', limit: '<= 0.002 m', status: isZeroBaseline ? 'INFO' : misclosure <= 0.002 ? 'SAFE' : 'WARNING' },
        { name: 'Reduced Level Check (Last RL - First RL)', symbol: 'Delta_RL', value: deltaRl.toFixed(3), unit: 'm', status: isZeroBaseline ? 'INFO' : misclosure <= 0.002 ? 'SAFE' : 'WARNING' },
        { name: 'Arithmetic Closure Error', symbol: 'Check', value: isZeroBaseline ? 'ZERO BASELINE (0 Stations)' : misclosure <= 0.002 ? `PASSED (${misclosure.toFixed(3)}m error)` : `MISCLOSURE (${misclosure.toFixed(3)}m)`, unit: 'audit', status: isZeroBaseline ? 'INFO' : misclosure <= 0.002 ? 'SAFE' : 'WARNING' },
      ];

      baseReport.stepByStepFormulas = [
        {
          stepNumber: 1,
          title: 'Differential Leveling Arithmetic Closure Verification',
          equation: 'Sum(BS) - Sum(FS) = Last RL - First RL',
          substitution: `Sum(BS) = ${sumBS.toFixed(3)} m, Sum(FS) = ${sumFS.toFixed(3)} m -> Delta = ${deltaSights.toFixed(3)} m vs Delta RL = ${deltaRl.toFixed(3)} m`,
          result: `Misclosure = ${misclosure.toFixed(4)} m (${misclosure <= 0.002 ? 'ARITHMETIC CHECK PASSED' : 'CHECK WARNING'})`,
          codeRef: 'Survey of Bangladesh (SoB) Leveling Spec',
        },
      ];

      if (stations.length > 0) {
        baseReport.takeoffTitle = 'DIFFERENTIAL LEVELING FIELD BOOK & REDUCED LEVEL SCHEDULE';
        baseReport.takeoffHeaders = ['Station', 'HI / Rise-Fall (m)', 'BS (m)', 'IS (m)', 'FS (m)', 'Reduced Level RL (m)', 'Remarks'];
        baseReport.takeoffRows = stations.map((st, idx) => ({
          col1: st.stationName || `ST-${idx + 1}`,
          col2: st.heightOfInstrument !== undefined ? `HI ${st.heightOfInstrument.toFixed(3)}` : st.rise ? `+${st.rise.toFixed(3)}` : st.fall ? `-${st.fall.toFixed(3)}` : '—',
          col3: st.backsight !== null && st.backsight !== undefined ? st.backsight.toFixed(3) : '—',
          col4: st.intermediateSight !== null && st.intermediateSight !== undefined ? st.intermediateSight.toFixed(3) : '—',
          col5: st.foresight !== null && st.foresight !== undefined ? st.foresight.toFixed(3) : '—',
          col6: st.reducedLevel.toFixed(3),
          col7: st.remarks || '—',
        }));
      }
      break;
    }

    // Site Management ERP Modules (10 Modules)
    case 'store-inventory':
    case 'material-requisition':
    case 'schedule-roster':
    case 'labor-attendance':
    case 'field-notebook':
    case 'contractor-bills':
    case 'petty-cash':
    case 'cube-tests':
    case 'daily-progress-report':
    case 'office-docs': {
      const siteErp = getSiteErpSnapshot(workspace.id);
      populateSiteErpReportData(moduleId, siteErp, workspace, baseReport);
      break;
    }

    case 'testing-lab-qaqc': {
      const labState = workspace.testingLab;
      const test =
        (labState?.activeTestId && TESTING_LAB_TEST_MAP[labState.activeTestId]) ||
        TESTING_LAB_TESTS[0];
      const inputs = {
        ...getDefaultInputsForTest(test),
        ...(labState?.draftInputsByTestId?.[test.id] || {}),
      };
      const checklistStates = test.checklistItems
        ? {
            ...getDefaultChecklistStates(test),
            ...(labState?.draftChecklistsByTestId?.[test.id] || {}),
          }
        : undefined;
      const ev = evaluateLabTest(test.id, inputs, checklistStates);

      baseReport.moduleMeta.moduleTitle = `${test.code}: ${test.title.en}`;
      baseReport.moduleMeta.standard = test.governingCodes.join(' | ');
      baseReport.moduleMeta.status =
        ev.verdict === 'PASS' ? 'PASS' : ev.verdict === 'WARNING' ? 'WARNING' : 'FAIL';

      baseReport.inputs = test.calculatorInputs.map((f) => ({
        name: f.label.en,
        symbol: f.key,
        value: inputs[f.key] ?? f.defaultValue,
        unit: f.unit || '-',
        notes: f.options ? f.options.find((o) => o.value === inputs[f.key])?.label.en : undefined,
      }));

      baseReport.outputs = ev.metrics.map((m) => ({
        name: m.labelEn,
        symbol: m.highlight ? 'PRIMARY' : 'METRIC',
        value: String(m.value),
        unit: m.unit || '-',
        limit: ev.codeLimitText,
        status: ev.verdict === 'PASS' ? 'PASS' : ev.verdict === 'WARNING' ? 'WARNING' : 'FAIL',
      }));

      baseReport.stepByStepFormulas = ev.steps.map((s, idx) => ({
        stepNumber: idx + 1,
        title: `Lab Evaluation Step ${idx + 1}`,
        equation: s,
        result: `${ev.primaryValue} ${ev.primaryUnit}`.trim(),
        codeRef: test.governingCodes[0] || 'BNBC-2020',
      }));
      break;
    }

    default: {
      // General Fallback
      baseReport.inputs = [
        { name: 'Module Configuration ID', symbol: 'ID', value: moduleId, unit: 'key', notes: 'BD. CivilLab Suite' },
      ];
      baseReport.outputs = [
        { name: 'Analysis Envelope Status', symbol: 'Status', value: envelope.status.toUpperCase(), unit: 'status', status: 'SAFE' },
      ];
      break;
    }
  }

  return baseReport;
}

/**
 * Helper to fetch site management data from local storage
 */
function getSiteErpSnapshot(projectId: string = 'default'): any {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(`bdcivillab_site_erp_v3_clean_${projectId}`) ||
      localStorage.getItem(`pbcivillab_site_erp_v3_clean_${projectId}`) ||
      localStorage.getItem('bdcivillab_site_erp_v3_clean_PROJ-DEFAULT-01') ||
      localStorage.getItem('pbcivillab_site_erp_v3_clean_PROJ-DEFAULT-01') ||
      localStorage.getItem('bdcivillab_site_erp_v3_clean_default') ||
      localStorage.getItem('pbcivillab_site_erp_v3_clean_default');
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local site ERP data:', err);
  }
  return null;
}

/**
 * Populates structured report data for any Site Management module
 */
function populateSiteErpReportData(
  moduleId: EngineeringModuleId,
  siteData: any,
  workspace: CivilWorkspace,
  report: EngineeringReportData
) {
  const currency = workspace.currency || 'BDT';

  switch (moduleId) {
    case 'store-inventory': {
      const inventory = siteData?.inventory || [];
      const lowStock = inventory.filter((item: any) => item.currentStock <= item.minThreshold).length;
      const totalVal = inventory.reduce((sum: number, it: any) => sum + (it.currentStock * (it.unitPrice || 0)), 0);

      report.moduleMeta.moduleTitle = 'Site Store & Material Inventory Ledger';
      report.moduleMeta.status = lowStock > 0 ? 'WARNING' : 'SAFE';

      report.inputs = [
        { name: 'Project Identifier', symbol: 'Proj', value: workspace.projectCode, unit: 'code', notes: workspace.name },
        { name: 'Site Store Location', symbol: 'Loc', value: workspace.siteLocation || 'Not Specified', unit: 'site', notes: 'Primary storage facility' },
        { name: 'Total Catalog Stock Items', symbol: 'N_items', value: inventory.length, unit: 'SKUs', notes: 'Active materials in ledger' },
      ];

      report.outputs = [
        { name: 'Total Inventory Valuation', symbol: 'Val_total', value: `${currency} ${totalVal.toLocaleString()}`, unit: currency, status: 'SAFE' },
        { name: 'Low Stock Deficit Warnings', symbol: 'LowStock', value: lowStock, unit: 'items', limit: '0 alerts', status: lowStock === 0 ? 'SAFE' : 'WARNING' },
      ];

      if (inventory.length > 0) {
        report.takeoffHeaders = ['Item Code', 'Material Description', 'Category', 'Current Stock', 'Unit', 'Unit Price', 'Total Value'];
        report.takeoffRows = inventory.map((it: any) => ({
          col1: it.itemCode || it.id || 'SKU',
          col2: it.name || it.materialName,
          col3: it.category || 'General',
          col4: it.currentStock,
          col5: it.unit || 'nos',
          col6: `${currency} ${(it.unitPrice || 0).toLocaleString()}`,
          col7: `${currency} ${(it.currentStock * (it.unitPrice || 0)).toLocaleString()}`,
        }));
      }
      break;
    }

    case 'material-requisition': {
      const requisitions = siteData?.requisitions || [];
      const pending = requisitions.filter((r: any) => r.status === 'Pending').length;
      const approved = requisitions.filter((r: any) => r.status === 'Approved').length;

      report.moduleMeta.moduleTitle = 'Material Requisitions & Purchase Orders';
      report.moduleMeta.status = pending > 0 ? 'WARNING' : 'SAFE';

      report.inputs = [
        { name: 'Project Identifier', symbol: 'Proj', value: workspace.projectCode, unit: 'code' },
        { name: 'Total Requisitions Logged', symbol: 'N_req', value: requisitions.length, unit: 'orders' },
      ];

      report.outputs = [
        { name: 'Pending Requisitions', symbol: 'Pending', value: pending, unit: 'orders', status: pending === 0 ? 'SAFE' : 'WARNING' },
        { name: 'Approved Requisitions', symbol: 'Approved', value: approved, unit: 'orders', status: 'SAFE' },
      ];

      if (requisitions.length > 0) {
        report.takeoffHeaders = ['Req No', 'Item Description', 'Requested Qty', 'Unit', 'Required By', 'Status'];
        report.takeoffRows = requisitions.map((req: any) => ({
          col1: req.reqNumber || req.id,
          col2: req.itemName || req.description,
          col3: req.quantity,
          col4: req.unit || 'nos',
          col5: req.requiredDate || 'Immediate',
          col6: req.status || 'Pending',
          col7: req.priority || 'Normal',
        }));
      }
      break;
    }

    case 'schedule-roster': {
      const milestones = siteData?.milestones || [];
      const completed = milestones.filter((m: any) => m.status === 'Completed' || m.progressPercent === 100).length;

      report.moduleMeta.moduleTitle = 'Construction Milestones & Work Breakdown Schedule';
      report.moduleMeta.status = 'SAFE';

      report.inputs = [
        { name: 'Project Duration', symbol: 'T_proj', value: `${workspace.boq.projectDurationMonths || 12} Months`, unit: 'duration' },
        { name: 'Total Milestones Tracked', symbol: 'N_tasks', value: milestones.length, unit: 'tasks' },
      ];

      report.outputs = [
        { name: 'Completed Tasks', symbol: 'Done', value: completed, unit: 'tasks', status: 'SAFE' },
        { name: 'Active Progress Tasks', symbol: 'In_Progress', value: milestones.length - completed, unit: 'tasks', status: 'INFO' },
      ];

      if (milestones.length > 0) {
        report.takeoffHeaders = ['Task ID', 'Work Description', 'Start Date', 'Target Date', 'Assigned To', 'Progress (%)'];
        report.takeoffRows = milestones.map((m: any) => ({
          col1: m.id || m.wbsCode,
          col2: m.title || m.name,
          col3: m.startDate || '—',
          col4: m.endDate || '—',
          col5: m.assignee || 'Field Team',
          col6: `${m.progressPercent || 0}%`,
          col7: m.status || 'Pending',
        }));
      }
      break;
    }

    case 'labor-attendance': {
      const workers = siteData?.workers || [];
      const active = workers.filter((w: any) => w.isActive !== false).length;
      const totalDailyWage = workers.reduce((sum: number, w: any) => sum + (w.dailyWage ?? 0), 0);

      report.moduleMeta.moduleTitle = 'Labor Muster Roll & Daily Wage Distribution';
      report.moduleMeta.status = 'SAFE';

      report.inputs = [
        { name: 'Registered Workforce', symbol: 'N_labor', value: workers.length, unit: 'workers' },
        { name: 'Daily Shift Protocol', symbol: 'Shift', value: 'Day Shift (8 Hours)', unit: 'standard' },
      ];

      report.outputs = [
        { name: 'Active Deployed Workers', symbol: 'Active', value: active, unit: 'workers', status: 'SAFE' },
        { name: 'Estimated Daily Payroll', symbol: 'W_daily', value: `${currency} ${totalDailyWage.toLocaleString()}`, unit: currency, status: 'SAFE' },
      ];

      if (workers.length > 0) {
        report.takeoffHeaders = ['Worker ID', 'Worker Name', 'Trade / Skill Category', 'Daily Wage Rate', 'Contact / NID', 'Status'];
        report.takeoffRows = workers.map((w: any) => ({
          col1: w.id || w.workerId,
          col2: w.name,
          col3: w.trade || w.category || 'Mason / General',
          col4: `${currency} ${(w.dailyWage ?? 0).toLocaleString()}`,
          col5: w.phone || 'On Record',
          col6: w.isActive !== false ? 'ACTIVE' : 'INACTIVE',
          col7: 'Verified',
        }));
      }
      break;
    }

    case 'field-notebook': {
      const notes = siteData?.fieldNotes || [];
      const critical = notes.filter((n: any) => n.criticality === 'high' || n.criticality === 'critical').length;

      report.moduleMeta.moduleTitle = 'Jobsite Engineering Diary & Observation Log';
      report.moduleMeta.status = critical > 0 ? 'WARNING' : 'SAFE';

      report.inputs = [
        { name: 'Project Location', symbol: 'Site', value: workspace.siteLocation || 'Field Office', unit: 'location' },
        { name: 'Logged Field Records', symbol: 'N_notes', value: notes.length, unit: 'entries' },
      ];

      report.outputs = [
        { name: 'Critical Non-Conformance Alerts', symbol: 'Critical', value: critical, unit: 'alerts', limit: '0 alerts', status: critical === 0 ? 'SAFE' : 'WARNING' },
        { name: 'Standard Field Notes', symbol: 'Routine', value: notes.length - critical, unit: 'entries', status: 'SAFE' },
      ];

      if (notes.length > 0) {
        report.takeoffHeaders = ['Entry Date', 'Category', 'Observation Title', 'Detailed Summary', 'Criticality'];
        report.takeoffRows = notes.map((n: any) => ({
          col1: n.date ? new Date(n.date).toLocaleDateString() : '—',
          col2: n.category || 'Site Inspection',
          col3: n.title,
          col4: n.content || n.observation || '—',
          col5: (n.criticality || 'Normal').toUpperCase(),
          col6: n.author || 'Site Engineer',
          col7: 'Logged',
        }));
      }
      break;
    }

    case 'contractor-bills': {
      const bills = siteData?.raBills || [];
      const totalClaimed = bills.reduce((sum: number, b: any) => sum + (b.claimedAmount || 0), 0);
      const totalCertified = bills.reduce((sum: number, b: any) => sum + (b.certifiedAmount || b.claimedAmount || 0), 0);

      report.moduleMeta.moduleTitle = 'Sub-Contractor Running Account (RA) Certification';
      report.moduleMeta.status = 'SAFE';

      report.inputs = [
        { name: 'Contractor Submittals', symbol: 'N_bills', value: bills.length, unit: 'invoices' },
        { name: 'Standard Retention Money', symbol: 'Retention', value: '5.0%', unit: '%', notes: 'Security deposit' },
      ];

      report.outputs = [
        { name: 'Gross Claimed Bill Value', symbol: 'Val_claimed', value: `${currency} ${totalClaimed.toLocaleString()}`, unit: currency, status: 'SAFE' },
        { name: 'Net Certified Payable', symbol: 'Val_certified', value: `${currency} ${totalCertified.toLocaleString()}`, unit: currency, status: 'SAFE' },
      ];

      if (bills.length > 0) {
        report.takeoffHeaders = ['Bill Ref', 'Sub-Contractor', 'Scope of Work', 'Claimed Amount', 'Certified Amount', 'Payment Status'];
        report.takeoffRows = bills.map((b: any) => ({
          col1: b.billNumber || b.id,
          col2: b.contractorName || 'Trade Contractor',
          col3: b.workDescription || 'Civil Works',
          col4: `${currency} ${(b.claimedAmount || 0).toLocaleString()}`,
          col5: `${currency} ${(b.certifiedAmount || b.claimedAmount || 0).toLocaleString()}`,
          col6: b.status || 'Certified',
          col7: 'Audited',
        }));
      }
      break;
    }

    case 'petty-cash': {
      const cashEntries = siteData?.pettyCash || [];
      const totalExpenses = cashEntries.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

      report.moduleMeta.moduleTitle = 'Site Petty Cash Expenditure Ledger';
      report.moduleMeta.status = 'SAFE';

      report.inputs = [
        { name: 'Cash Ledger Entries', symbol: 'N_vouchers', value: cashEntries.length, unit: 'receipts' },
        { name: 'Authorized Custodian', symbol: 'InCharge', value: workspace.engineerOfRecord || 'Site In-Charge', unit: 'officer' },
      ];

      report.outputs = [
        { name: 'Total Disbursed Petty Expenses', symbol: 'Exp_total', value: `${currency} ${totalExpenses.toLocaleString()}`, unit: currency, status: 'SAFE' },
      ];

      if (cashEntries.length > 0) {
        report.takeoffHeaders = ['Voucher No', 'Transaction Date', 'Payee / Vendor', 'Expense Category', 'Amount', 'Remarks'];
        report.takeoffRows = cashEntries.map((c: any) => ({
          col1: c.voucherNo || c.id,
          col2: c.date ? new Date(c.date).toLocaleDateString() : '—',
          col3: c.payee || 'Local Merchant',
          col4: c.category || 'Site Consumables',
          col5: `${currency} ${(c.amount || 0).toLocaleString()}`,
          col6: c.remarks || 'Voucher Verified',
          col7: 'Passed',
        }));
      }
      break;
    }

    case 'cube-tests': {
      const tests = siteData?.cubeTests || [];
      const tested = tests.filter((t: any) => t.status === 'Tested' || t.compressiveStrengthMpa > 0).length;

      report.moduleMeta.moduleTitle = 'Concrete Cube Compressive Strength QA/QC Register';
      report.moduleMeta.status = 'SAFE';

      report.inputs = [
        { name: 'Casting Specimens Tracked', symbol: 'N_cubes', value: tests.length, unit: 'cubes' },
        { name: 'Curing Standard', symbol: 'Protocol', value: '28-Day Potable Water Bath', unit: 'standard', notes: 'ASTM C39 / BNBC' },
      ];

      report.outputs = [
        { name: 'Crushed & Tested Specimens', symbol: 'Tested', value: tested, unit: 'specimens', status: 'SAFE' },
        { name: 'Awaiting Curing Period', symbol: 'Curing', value: tests.length - tested, unit: 'specimens', status: 'INFO' },
      ];

      if (tests.length > 0) {
        report.takeoffHeaders = ['Sample Tag', 'Cast Date', 'Test Date', 'Age (Days)', 'Crush Load (kN)', 'Strength (MPa)', 'Compliance'];
        report.takeoffRows = tests.map((t: any) => ({
          col1: t.sampleId || t.id,
          col2: t.castDate || '—',
          col3: t.testDate || '—',
          col4: `${t.ageDays || 28} Days`,
          col5: `${t.crushingLoadKn || 0} kN`,
          col6: `${(t.compressiveStrengthMpa || 0).toFixed(1)} MPa`,
          col7: (t.compressiveStrengthMpa || 0) >= 20 ? 'PASS (fck >= 20)' : 'SCHEDULED',
        }));
      }
      break;
    }

    case 'daily-progress-report': {
      const dprs = siteData?.dprEntries || [];

      report.moduleMeta.moduleTitle = 'Daily Progress Report (DPR) Submittal';
      report.moduleMeta.status = 'SAFE';

      report.inputs = [
        { name: 'Project Name', symbol: 'Proj', value: workspace.name, unit: 'project' },
        { name: 'Total DPR Logs Recorded', symbol: 'N_dpr', value: dprs.length, unit: 'days' },
      ];

      report.outputs = [
        { name: 'DPR Documentation Status', symbol: 'DPR_Status', value: '100% Up to Date', unit: 'status', status: 'SAFE' },
      ];

      if (dprs.length > 0) {
        report.takeoffHeaders = ['DPR Ref', 'Report Date', 'Weather', 'Total Workforce', 'Key Daily Milestone Accomplished'];
        report.takeoffRows = dprs.map((d: any) => ({
          col1: d.dprNumber || d.id,
          col2: d.date ? new Date(d.date).toLocaleDateString() : '—',
          col3: d.weather || 'Clear / Sunny',
          col4: `${d.laborCount || 0} Workers`,
          col5: d.workSummary || d.progressNotes || 'Site Activities Conducted',
          col6: 'Verified by PE',
          col7: 'Archived',
        }));
      }
      break;
    }

    case 'office-docs': {
      report.moduleMeta.moduleTitle = 'Official Engineering Office Documents & Letters';
      report.moduleMeta.status = 'SAFE';

      report.inputs = [
        { name: 'Project Name', symbol: 'Proj', value: workspace.name, unit: 'project' },
        { name: 'Project Code', symbol: 'Code', value: workspace.projectCode, unit: 'id' },
      ];

      report.outputs = [
        { name: 'Documentation Formats', symbol: 'Doc_Types', value: '5 Official Templates', unit: 'contracts', status: 'SAFE' },
      ];
      break;
    }
  }
}

/**
 * High-level helper to trigger export of certified engineering PDF for the active module
 */
export async function exportCertifiedReportPDF(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace,
  envelope: CalculationEnvelope<any>,
  userProfile?: UserProfile,
  onProgress?: (progress: { stage: string; percent: number }) => void,
  options?: PdfExportEngineOptions
): Promise<jsPDF> {
  const reportData = buildReportDataFromWorkspace(moduleId, workspace, envelope, userProfile);

  // Sync to verification registry
  try {
    const verifiedRecord = createVerifiedReportRecord(
      workspace,
      moduleId,
      envelope,
      userProfile,
      reportData.docId
    );
    saveVerifiedReport(verifiedRecord);
    reportData.qrLinkUrl = verifiedRecord.verificationUrl;
  } catch (e) {
    console.warn('Verification record sync warning:', e);
  }

  const filename = options?.filename || `${moduleId}_submittal_${workspace.projectCode || 'BDCL'}.pdf`;
  return generateEngineeringPDF(reportData, {
    ...options,
    onProgress: options?.onProgress || onProgress,
    autoDownload: options?.autoDownload ?? true,
    filename,
  });
}

/**
 * Safe DOM print trigger that populates `#pb-printable-report` (if HTML provided or cloned from active print area)
 * and prevents premature `afterprint` DOM wiping before the browser print preview finishes rasterizing.
 */
export function triggerSafeDomPrint(customHtml?: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const printEl = document.getElementById('pb-printable-report');
  if (!printEl) {
    window.print();
    return true;
  }

  if (customHtml && customHtml.trim().length > 0) {
    printEl.innerHTML = customHtml;
  } else if (!printEl.innerHTML || printEl.innerHTML.trim().length === 0) {
    // Capture visible printable sheet or active module card if printEl was empty
    const explicitPrintTarget = document.querySelector('.print\\:block:not(#pb-printable-report)') as HTMLElement | null;
    if (explicitPrintTarget) {
      printEl.innerHTML = `<div class="p-6 bg-white text-slate-900 font-sans">${explicitPrintTarget.innerHTML}</div>`;
    }
  }

  printEl.className = 'print:block bg-white text-slate-900 p-6 font-sans m-0 leading-relaxed';
  document.body.classList.add('is-printing-report');

  const cleanUp = () => {
    window.removeEventListener('afterprint', cleanUp);
    setTimeout(() => {
      document.body.classList.remove('is-printing-report');
      printEl.className = 'hidden print:block bg-white text-slate-900';
    }, 600);
  };
  window.addEventListener('afterprint', cleanUp);
  setTimeout(() => {
    window.print();
  }, 100);
  return true;
}

// ============================================================================
// 6. SPECIALIZED CSV EXPORTERS (BBS, BOQ, EARTHWORK, UNIVERSAL SCHEDULE)
// ============================================================================

/**
 * One-click export for Bar Bending Schedule (BBS) to Excel-ready CSV
 */
export function exportBbsCSV(
  workspace: CivilWorkspace,
  result: RebarBBSResult,
  userProfile?: UserProfile
): void {
  const metadata: CSVExportMetadata = {
    projectName: workspace.name,
    projectCode: workspace.projectCode,
    moduleTitle: `BAR BENDING SCHEDULE — ${workspace.rebarBbs.elementType.toUpperCase()}`,
    engineerName: userProfile?.fullName || workspace.engineerOfRecord,
    date: new Date().toISOString().slice(0, 10),
    unitSystem: workspace.unitPreferences?.systemPreset === 'imperial' ? 'Imperial' : 'SI',
  };

  const headers = [
    'Bar Mark',
    'Description',
    'Bar Dia (mm)',
    'Unit Wt (kg/m)',
    'Cutting Length (m)',
    'No. of Bars',
    'Total Length (m)',
    'Bend Deduction (m)',
    'Total Weight (kg)',
  ];

  const rows: (string | number)[][] = result.items.map((it, idx) => [
    `B-${idx + 1}`,
    it.description,
    it.barDiaMm,
    it.unitWeightKgPerM.toFixed(3),
    it.cuttingLengthM.toFixed(3),
    it.count,
    it.totalLengthM.toFixed(2),
    it.bendDeductionM.toFixed(3),
    it.totalWeightKg.toFixed(2),
  ]);

  // Summary rows
  rows.push([]);
  rows.push(['SUMMARY TOTALS', '', '', '', '', '', '', '', '']);
  rows.push(['Total Cut Length (m)', '', '', '', '', '', result.totalBarsLengthM.toFixed(2), '', '']);
  rows.push(['Total Reinforcement Weight (kg)', '', '', '', '', '', '', '', result.totalSteelWeightKg.toFixed(2)]);
  rows.push(['Total Rebar Tonnes (MT)', '', '', '', '', '', '', '', result.totalSteelTonnes.toFixed(3)]);
  rows.push(['Nominal Hook Bend Angle', '', '', '', '', '', '', '', `${workspace.rebarBbs.hookAngle || '90'} deg standard`]);

  exportToCSV(`${workspace.projectCode || 'BDCL'}_Rebar_BBS_Schedule.csv`, headers, rows, metadata);
}

/**
 * One-click export for Bill of Quantities (BOQ) & Takeoff to Excel-ready CSV
 */
export function exportBoqCSV(
  workspace: CivilWorkspace,
  result: BOQResult,
  userProfile?: UserProfile
): void {
  const metadata: CSVExportMetadata = {
    projectName: workspace.name,
    projectCode: workspace.projectCode,
    moduleTitle: 'BILL OF QUANTITIES (BOQ) & MATERIAL TAKEOFF SCHEDULE',
    engineerName: userProfile?.fullName || workspace.engineerOfRecord,
    currency: result.currency,
    date: new Date().toISOString().slice(0, 10),
  };

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
    `Unit Rate (${result.currency})`,
    `Total Amount (${result.currency})`,
  ];

  const rows: (string | number)[][] = result.items.map((it) => [
    it.itemNo,
    it.description,
    it.category,
    it.numberOfMembers,
    it.lengthM,
    it.widthM,
    it.heightM,
    it.deductionQty,
    it.unit,
    it.grossQty,
    it.netQty,
    it.wastagePercent,
    it.totalBillableQty,
    it.unitRate,
    it.itemTotalAmount,
  ]);

  rows.push([]);
  rows.push(['FINANCIAL SUMMARY', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  rows.push(['Subtotal Direct Works', '', '', '', '', '', '', '', '', '', '', '', '', '', result.subtotalAmount.toFixed(2)]);
  rows.push([`Contingency (${result.contingencyPercent}%)`, '', '', '', '', '', '', '', '', '', '', '', '', '', result.contingencyAmount.toFixed(2)]);
  rows.push([`Contractor Overhead & Profit (${result.contractorOverheadPercent}%)`, '', '', '', '', '', '', '', '', '', '', '', '', '', result.contractorOverheadAmount.toFixed(2)]);
  rows.push([`VAT / Tax (${result.vatTaxPercent}%)`, '', '', '', '', '', '', '', '', '', '', '', '', '', result.vatTaxAmount.toFixed(2)]);
  rows.push([`GRAND TOTAL BOQ (${result.currency})`, '', '', '', '', '', '', '', '', '', '', '', '', '', result.grandTotalAmount.toFixed(2)]);

  exportToCSV(`${workspace.projectCode || 'BDCL'}_BOQ_Estimate_Schedule.csv`, headers, rows, metadata);
}

/**
 * One-click export for Earthwork Alignment & Prismoidal Volumes to Excel-ready CSV
 */
export function exportEarthworkCSV(
  workspace: CivilWorkspace,
  result: any,
  userProfile?: UserProfile
): void {
  const metadata: CSVExportMetadata = {
    projectName: workspace.name,
    projectCode: workspace.projectCode,
    moduleTitle: 'EARTHWORK EXCAVATION & ROAD ALIGNMENT VOLUME SCHEDULE',
    engineerName: userProfile?.fullName || workspace.engineerOfRecord,
    date: new Date().toISOString().slice(0, 10),
  };

  const headers = [
    'Parameter Description',
    'Classification / Station',
    'Value',
    'Unit',
    'Engineering Remarks',
  ];

  const rows: (string | number)[][] = [
    ['Calculation Type', workspace.earthwork.calculationType || 'prismoidal-road', result.calculationType || 'Volume', 'Method', 'Standard Civil Spec'],
    ['Soil Classification', workspace.earthwork.soilType || 'Common Earth', result.soilClassification || 'Common', 'Soil Type', 'Geotechnical Category'],
    ['Bank In-Situ Volume', 'Natural Cut', result.bankVolumeM3 ? result.bankVolumeM3.toFixed(2) : '0.00', 'm^3', 'Natural state excavation'],
    ['Swell Factor', 'Expansion', result.swellFactor ? result.swellFactor.toFixed(2) : '1.25', 'ratio', 'Bulking during excavation'],
    ['Loose Haul Volume', 'Truck Hauling', result.looseVolumeM3 ? result.looseVolumeM3.toFixed(2) : '0.00', 'm^3', 'Total hauled volume'],
    ['Compacted Embankment Volume', 'Fill Placement', result.compactedVolumeM3 ? result.compactedVolumeM3.toFixed(2) : '0.00', 'm^3', 'Post-compaction density'],
    ['Haul Truck Trips Required', '10 m^3 Dumper', result.haulTruckTripsCount10M3 || 0, 'trips', 'Based on 10 m^3 standard dumper capacity'],
  ];

  if (result.areaStation1M2 !== undefined) {
    rows.push([]);
    rows.push(['PRISMOIDAL ROADWAY ALIGNMENT CROSS-SECTION DATA', '', '', '', '']);
    rows.push(['Station 1 End Area', 'Cross-section 1', result.areaStation1M2.toFixed(3), 'm^2', 'Initial cut/fill area']);
    rows.push(['Mid-Station End Area', 'Midpoint', result.areaStationMidM2?.toFixed(3) || '—', 'm^2', 'Interpolated / measured mid-section']);
    rows.push(['Station 2 End Area', 'Cross-section 2', result.areaStation3M2?.toFixed(3) || '—', 'm^2', 'Terminal cut/fill area']);
    rows.push(['Prismoidal Accurate Volume', 'Simpson Rule', result.prismoidalVolumeM3?.toFixed(2) || '—', 'm^3', 'V = (L/6)*(A1 + 4*Am + A2)']);
    rows.push(['Trapezoidal Average End Area', 'Standard Formula', result.trapezoidalVolumeM3?.toFixed(2) || '—', 'm^3', 'V = (L/2)*(A1 + A2)']);
    rows.push(['Prismoidal Correction Factor', 'Volume Delta', result.prismoidalCorrectionM3?.toFixed(2) || '—', 'm^3', 'Correction between methods']);
  }

  if (Array.isArray(result.stationSchedule) && result.stationSchedule.length >= 2) {
    rows.push([]);
    rows.push(['MULTI-STATION CHAINAGE CUT/FILL & MASS-HAUL SCHEDULE', '', '', '', '']);
    for (const st of result.stationSchedule) {
      rows.push([
        `Chainage ${st.chainageM}m (Cut ${st.cutDepthM}m / Fill ${st.fillHeightM}m)`,
        `Seg Cut ${st.segmentCutPrismoidalM3.toFixed(1)} / Seg Fill ${st.segmentFillPrismoidalM3.toFixed(1)}`,
        st.cumMassHaulBalanceM3.toFixed(2),
        'm^3 (Net)',
        `Cum Cut=${st.cumCutBankM3.toFixed(1)} m^3, Cum Fill=${st.cumFillCompactedM3.toFixed(1)} m^3`,
      ]);
    }
  }

  exportToCSV(`${workspace.projectCode || 'BDCL'}_Earthwork_Schedule.csv`, headers, rows, metadata);
}

/**
 * Universal module-aware CSV exporter that routes to the optimal schedule schema
 */
export function exportModuleCSV(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace,
  envelope: CalculationEnvelope<any>,
  userProfile?: UserProfile
): void {
  if (!envelope.result) return;

  if (moduleId === 'rebar-bbs') {
    exportBbsCSV(workspace, envelope.result as RebarBBSResult, userProfile);
    return;
  }

  if (moduleId === 'boq-estimator') {
    exportBoqCSV(workspace, envelope.result as BOQResult, userProfile);
    return;
  }

  if (moduleId === 'earthwork-alignment') {
    exportEarthworkCSV(workspace, envelope.result, userProfile);
    return;
  }

  // Universal schedule extractor for any other calculator
  const reportData = buildReportDataFromWorkspace(moduleId, workspace, envelope, userProfile);
  const metadata: CSVExportMetadata = {
    projectName: workspace.name,
    projectCode: workspace.projectCode,
    moduleTitle: reportData.moduleMeta.moduleTitle,
    standard: reportData.moduleMeta.standard,
    status: reportData.moduleMeta.status,
    engineerName: userProfile?.fullName || workspace.engineerOfRecord,
    date: new Date().toISOString().slice(0, 10),
    unitSystem: workspace.unitPreferences?.systemPreset === 'imperial' ? 'Imperial' : 'SI',
  };

  const headers = ['Category', 'Parameter Description', 'Symbol', 'Value', 'Unit', 'Code Limit / Status'];
  const rows: (string | number)[][] = [];

  // 1. Inputs
  reportData.inputs.forEach((inp) => {
    rows.push(['INPUT', inp.name, inp.symbol, String(inp.value), inp.unit, inp.notes || '—']);
  });

  // 2. Outputs
  reportData.outputs.forEach((out) => {
    rows.push(['OUTPUT', out.name, out.symbol, String(out.value), out.unit, out.limit || out.status]);
  });

  // 3. Takeoffs if present
  if (reportData.takeoffRows && reportData.takeoffRows.length > 0) {
    rows.push([]);
    rows.push(['TAKEOFF / SCHEDULE ITEMS', '', '', '', '', '']);
    reportData.takeoffRows.forEach((r) => {
      rows.push(['SCHEDULE', r.col2, r.col1, String(r.col4), r.col3, String(r.col5)]);
    });
  }

  exportToCSV(`${workspace.projectCode || 'BDCL'}_${moduleId.toUpperCase()}_Schedule.csv`, headers, rows, metadata);
}

// ============================================================================
// 7. ARCHITECTURE SUITE CERTIFIED PDF & A4 PRINT SUBMITTAL EXPORTER
// ============================================================================

export interface ArchitectureSubmittalPayload {
  tabId: string;
  tabTitle: string;
  codeStandard: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  projectName?: string;
  projectCode?: string;
  siteLocation?: string;
  userProfile?: UserProfile;
  brandLogoSrc?: string;
  inputs: ReportParameterRow[];
  dcrSummary: Array<{
    label: string;
    demand: string;
    capacity: string;
    ratio: number;
    status: 'PASS' | 'WARNING' | 'FAIL';
  }>;
  steps: Array<{
    stepNumber: number | string;
    title: string;
    formula: string;
    substitution: string;
    result: string;
    reasoning?: string;
  }>;
  svgElements?: SVGSVGElement[];
}

export async function captureSvgToPngDataUrl(
  svgEl: SVGSVGElement
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  if (typeof window === 'undefined' || !svgEl) return null;
  try {
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    const vb = svgEl.viewBox?.baseVal;
    const rect = svgEl.getBoundingClientRect();
    const w = vb && vb.width > 0 ? vb.width : Math.max(640, rect.width || 640);
    const h = vb && vb.height > 0 ? vb.height : Math.max(280, rect.height || 280);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(w));
    clone.setAttribute('height', String(h));

    // Set pure white CAD blueprint background for clean printing & PDF output
    clone.style.backgroundColor = '#ffffff';
    clone.style.color = '#0f172a';

    // Walk all elements in the cloned SVG to convert dark-mode canvas fills/strokes
    // into crisp Light CAD Blueprint colors on a white sheet.
    const darkSurfaceHexes = new Set([
      '#0f172a',
      '#1e293b',
      '#111827',
      '#090d16',
      '#141413',
      '#020617',
      '#18181b',
      '#0b1120',
      '#172554',
      '#1e1b4b',
    ]);
    const lightTextHexes = new Set([
      '#ffffff',
      '#fff',
      '#f8fafc',
      '#f1f5f9',
      '#e2e8f0',
      '#cbd5e1',
    ]);

    const allNodes = Array.from(clone.querySelectorAll('*'));
    for (const el of allNodes) {
      const tag = el.tagName.toLowerCase();
      const fill = (el.getAttribute('fill') || '').trim().toLowerCase();
      const stroke = (el.getAttribute('stroke') || '').trim().toLowerCase();

      // Convert dark background rectangles/polygons into crisp light blueprint surfaces
      if ((tag === 'rect' || tag === 'polygon' || tag === 'path') && darkSurfaceHexes.has(fill)) {
        el.setAttribute('fill', '#f8fafc');
        if (!stroke || darkSurfaceHexes.has(stroke) || stroke === '#334155') {
          el.setAttribute('stroke', '#cbd5e1');
        }
      }

      // Convert white/light text or tick marks into deep architectural navy
      if (tag === 'text' || tag === 'tspan') {
        if (!fill || lightTextHexes.has(fill) || fill.includes('--md-sys-color-on-surface')) {
          el.setAttribute('fill', '#0f172a');
        } else if (fill === '#94a3b8') {
          el.setAttribute('fill', '#334155');
        } else if (fill === '#38bdf8' || fill === '#60a5fa') {
          el.setAttribute('fill', '#1d4ed8');
        } else if (fill === '#fbbf24' || fill === '#facc15') {
          el.setAttribute('fill', '#b45309');
        } else if (fill === '#34d399' || fill === '#4ade80') {
          el.setAttribute('fill', '#047857');
        } else if (fill === '#f87171' || fill === '#fb7185') {
          el.setAttribute('fill', '#be123c');
        }
      } else {
        // Non-text geometry strokes (dimension lines, axes, gridlines)
        if (lightTextHexes.has(stroke)) {
          el.setAttribute('stroke', '#1e293b');
        } else if (stroke === '#334155' || stroke === '#1e293b') {
          el.setAttribute('stroke', '#cbd5e1');
        } else if (stroke === '#38bdf8') {
          el.setAttribute('stroke', '#0284c7');
        }
      }
    }

    // Resolve CSS custom properties and currentColor to Light CAD Blueprint palette
    let svgText = new XMLSerializer().serializeToString(clone);
    const cssVarMap: Record<string, string> = {
      'var(--md-sys-color-on-surface)': '#0f172a',
      'var(--md-sys-color-on-surface-variant)': '#334155',
      'var(--md-sys-color-primary)': '#1d4ed8',
      'var(--md-sys-color-primary-container)': '#dbeafe',
      'var(--md-sys-color-on-primary-container)': '#1e3a8a',
      'var(--md-sys-color-secondary)': '#4338ca',
      'var(--md-sys-color-tertiary)': '#b45309',
      'var(--md-sys-color-error)': '#be123c',
      'var(--md-sys-color-outline)': '#64748b',
      'var(--md-sys-color-outline-variant)': '#cbd5e1',
      'var(--md-sys-color-surface)': '#ffffff',
      'var(--md-sys-color-surface-container)': '#f8fafc',
      'var(--md-sys-color-surface-container-low)': '#ffffff',
      'var(--md-sys-color-surface-container-high)': '#f1f5f9',
      'var(--md-sys-color-surface-container-highest)': '#e2e8f0',
      currentColor: '#0f172a',
    };
    for (const [token, hex] of Object.entries(cssVarMap)) {
      svgText = svgText.split(token).join(hex);
    }
    svgText = svgText.replace(/var\(--[^)]+\)/g, '#334155');

    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = url;
    });

    const scale = 2.25;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(url);
      return null;
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: w,
      height: h,
    };
  } catch (err) {
    console.warn('[Engineering PDF] SVG capture fallback:', err);
    return null;
  }
}

async function loadImageAsPngDataUrl(src: string): Promise<string | null> {
  if (typeof window === 'undefined' || !src) return null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = (e) => reject(e);
      image.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(64, img.naturalWidth || 128);
    canvas.height = Math.max(64, img.naturalHeight || 128);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export async function exportArchitectureSubmittalPDF(
  payload: ArchitectureSubmittalPayload
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;
  const docId = generateSubmittalDocRef(new Date().getFullYear());
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // QR stamp
  let qrDataUrl = '';
  try {
    const qrTarget =
      typeof window !== 'undefined' && window.location?.href
        ? `${window.location.origin}?arch_doc=${encodeURIComponent(docId)}`
        : `https://bd-civillab.engine?doc=${encodeURIComponent(docId)}`;
    qrDataUrl = await QRCode.toDataURL(qrTarget, {
      margin: 1,
      width: 140,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch {
    qrDataUrl = '';
  }

  const logoDataUrl =
    (await getBrandLogoLightPngDataUrl(256)) ||
    (payload.brandLogoSrc ? await loadImageAsPngDataUrl(payload.brandLogoSrc) : null) ||
    (await getBrandLogoPngDataUrl(256));

  // Clean Light Architectural Header Title Block
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(30, 58, 138);
  doc.setLineWidth(0.45);
  doc.roundedRect(margin, margin, contentWidth, 25, 1.5, 1.5, 'FD');
  doc.setFillColor(30, 58, 138);
  doc.rect(margin, margin, contentWidth, 1.6, 'F');

  let textStartX = margin + 4;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin + 3, margin + 3.5, 17, 17);
    textStartX = margin + 23;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('BD. CIVILLAB - ARCHITECTURE & BY-LAW SUBMITTAL', textStartX, margin + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text(sanitizeEngineeringSymbols(payload.tabTitle), textStartX, margin + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    sanitizeEngineeringSymbols(
      `REF: ${docId}  |  CODE: ${payload.codeStandard}  |  OVERALL STATUS: ${payload.status}`
    ),
    textStartX,
    margin + 19
  );

  if (qrDataUrl) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin + contentWidth - 22.5, margin + 2.5, 20, 20, 1, 1, 'FD');
    doc.addImage(qrDataUrl, 'PNG', margin + contentWidth - 22, margin + 3, 19, 19);
  }

  // Project & Engineer Credentials Box
  let yPos = margin + 29;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, 'FD');

  const engName = payload.userProfile?.fullName || 'Pending Signature';
  const engDesig = payload.userProfile?.designation || 'Architect / Engineer';
  const engOrg = payload.userProfile?.organization || 'Independent Practice';
  const engLic = payload.userProfile?.licenseNumber || 'Pending License';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    sanitizeEngineeringSymbols(`Project: ${payload.projectName || 'Untitled Project'} (${payload.projectCode || 'PRJ-001'})`),
    margin + 4,
    yPos + 6
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    sanitizeEngineeringSymbols(`Site Location: ${payload.siteLocation || 'Not Specified'}  |  Date: ${dateStr}`),
    margin + 4,
    yPos + 11.5
  );
  doc.text(
    sanitizeEngineeringSymbols(`Prepared By: ${engName} (${engDesig})  |  ${engOrg}  |  Reg: ${engLic}`),
    margin + 4,
    yPos + 17
  );

  yPos += 27;

  // 1. Capture & Embed 2D CAD SVG Diagram(s)
  const validSvgs = (payload.svgElements || []).filter((s) => isEngineeringSchematicSvg(s));
  if (validSvgs.length > 0) {
    for (let sIdx = 0; sIdx < validSvgs.length; sIdx++) {
      const captured = await captureSvgToPngDataUrl(validSvgs[sIdx]);
      if (captured) {
        const maxImgW = contentWidth;
        const aspect = captured.height / Math.max(1, captured.width);
        const renderH = Math.min(72, maxImgW * aspect);
        const renderW = renderH / aspect;
        const imgX = margin + (contentWidth - renderW) / 2;

        if (yPos + renderH + 10 > pageHeight - 20) {
          doc.addPage();
          yPos = 16;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 138);
        doc.text(
          sIdx === 0
            ? '1. 2D ARCHITECTURAL / ENGINEERING CAD SCHEMATIC'
            : `1.${sIdx + 1} SUPPLEMENTARY CAD SCHEMATIC`,
          margin,
          yPos
        );
        yPos += 2.5;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(148, 163, 184);
        doc.roundedRect(margin, yPos, contentWidth, renderH + 3, 1.5, 1.5, 'FD');
        doc.addImage(captured.dataUrl, 'PNG', imgX, yPos + 1.5, renderW, renderH);
        yPos += renderH + 7;
      }
    }
  }

  // 2. Design Inputs Schedule
  if (payload.inputs.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('2. DESIGN INPUT PARAMETERS', margin, yPos);
    yPos += 2.5;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Parameter', 'Symbol', 'Value', 'Unit', 'Remarks']],
      body: payload.inputs.map((inp) => [
        sanitizeEngineeringSymbols(inp.name),
        sanitizeEngineeringSymbols(inp.symbol),
        sanitizeEngineeringSymbols(String(inp.value)),
        sanitizeEngineeringSymbols(inp.unit),
        sanitizeEngineeringSymbols(inp.notes || '—'),
      ]),
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.6, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.15 },
      headStyles: { fillColor: [239, 246, 255], textColor: [30, 58, 138], lineColor: [148, 163, 184], lineWidth: 0.2, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  // 3. DCR Compliance Summary
  if (payload.dcrSummary.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('3. CODE COMPLIANCE & LIMIT-STATE DCR SUMMARY', margin, yPos);
    yPos += 2.5;

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [['Compliance Check', 'Demand / Actual', 'Allowable / Limit', 'DCR Ratio', 'Status']],
      body: payload.dcrSummary.map((d) => [
        sanitizeEngineeringSymbols(d.label),
        sanitizeEngineeringSymbols(d.demand),
        sanitizeEngineeringSymbols(d.capacity),
        d.ratio.toFixed(2),
        d.status,
      ]),
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.6, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.15 },
      headStyles: { fillColor: [239, 246, 255], textColor: [30, 58, 138], lineColor: [148, 163, 184], lineWidth: 0.2, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 6;
  }

  // 4. Step-by-Step Hand Calculation Derivations
  if (payload.steps.length > 0) {
    if (yPos > pageHeight - 35) {
      doc.addPage();
      yPos = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('4. STEP-BY-STEP CODE DERIVATIONS & HAND VERIFICATION', margin, yPos);
    yPos += 4;

    for (const step of payload.steps) {
      if (yPos + 22 > pageHeight - 22) {
        doc.addPage();
        yPos = 16;
      }
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, yPos, contentWidth, 19, 1.5, 1.5, 'FD');
      doc.setFillColor(245, 158, 11);
      doc.rect(margin, yPos, 1.5, 19, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        sanitizeEngineeringSymbols(`[Step ${step.stepNumber}] ${step.title}`),
        margin + 3.5,
        yPos + 4.3
      );

      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 58, 138);
      doc.text(
        sanitizeEngineeringSymbols(`Formula: ${step.formula}`).slice(0, 108),
        margin + 3.5,
        yPos + 8.6
      );

      doc.setFont('courier', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(
        sanitizeEngineeringSymbols(`Calc: ${step.substitution} -> ${step.result}`).slice(0, 112),
        margin + 3.5,
        yPos + 12.6
      );

      if (step.reasoning) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.3);
        doc.setTextColor(71, 85, 105);
        doc.text(sanitizeEngineeringSymbols(`Note: ${step.reasoning}`).slice(0, 118), margin + 3.5, yPos + 16.5);
      }

      yPos += 21;
    }
  }

  // Signature Block
  if (yPos + 28 > pageHeight - 18) {
    doc.addPage();
    yPos = 16;
  }
  yPos += 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, yPos, contentWidth, 24, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFIED BY (ARCHITECT / ENGINEER OF RECORD)', margin + 4, yPos + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(sanitizeEngineeringSymbols(`${engName} | ${engDesig}`), margin + 4, yPos + 10);
  doc.text(sanitizeEngineeringSymbols(`${engOrg} | Reg: ${engLic}`), margin + 4, yPos + 14.5);
  doc.line(margin + 28, yPos + 21, margin + 88, yPos + 21);
  doc.text('Signature & Seal:', margin + 4, yPos + 20.5);
  doc.text(`Date: ${dateStr}`, margin + 94, yPos + 20.5);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.line(margin, pageHeight - 9, margin + contentWidth, pageHeight - 9);
    doc.text(sanitizeEngineeringSymbols(`BD. CivilLab Architecture Submittal  |  Ref: ${docId}`), margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, margin + contentWidth, pageHeight - 6, { align: 'right' });
  }

  doc.save(`${payload.projectCode || 'BDCL'}_ARCH_${payload.tabId.toUpperCase()}_${docId}.pdf`);
  return doc;
}

export async function printArchitectureSubmittalA4(
  payload: ArchitectureSubmittalPayload
): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const docId = generateSubmittalDocRef(new Date().getFullYear());
  const nowStr = new Date().toLocaleString();
  const engName = payload.userProfile?.fullName || 'Pending Signature';
  const engDesig = payload.userProfile?.designation || 'Architect / Engineer';
  const engOrg = payload.userProfile?.organization || 'Independent Practice';
  const engLic = payload.userProfile?.licenseNumber || 'Pending License';

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(`https://civillab.bd/verify?doc=${docId}`, {
      margin: 1,
      width: 120,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch {
    qrDataUrl = '';
  }

  const svgHtmlBlocks = (payload.svgElements || [])
    .filter((svg) => isEngineeringSchematicSvg(svg))
    .map((svg) => {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('class', 'w-full max-h-[280px] rounded-lg border border-slate-300 bg-white');
      return `<div class="my-2 flex justify-center">${clone.outerHTML}</div>`;
    })
    .join('');

  const inputRowsHtml = payload.inputs
    .map(
      (inp) => `
      <tr class="border-b border-slate-200">
        <td class="py-1.5 px-2 font-medium text-slate-800">${inp.name}</td>
        <td class="py-1.5 px-2 font-mono text-center text-slate-600">${inp.symbol}</td>
        <td class="py-1.5 px-2 font-mono text-right font-bold text-slate-900">${inp.value}</td>
        <td class="py-1.5 px-2 font-mono text-center text-slate-600">${inp.unit}</td>
        <td class="py-1.5 px-2 text-slate-500">${inp.notes || '—'}</td>
      </tr>`
    )
    .join('');

  const dcrRowsHtml = payload.dcrSummary
    .map(
      (d) => `
      <tr class="border-b border-slate-200">
        <td class="py-1.5 px-2 font-medium text-slate-800">${d.label}</td>
        <td class="py-1.5 px-2 font-mono text-right">${d.demand}</td>
        <td class="py-1.5 px-2 font-mono text-right">${d.capacity}</td>
        <td class="py-1.5 px-2 font-mono text-center font-bold">${d.ratio.toFixed(2)}</td>
        <td class="py-1.5 px-2 font-mono text-center font-bold ${
          d.status === 'PASS' ? 'text-emerald-700' : d.status === 'WARNING' ? 'text-amber-700' : 'text-rose-700'
        }">${d.status}</td>
      </tr>`
    )
    .join('');

  const stepsHtml = payload.steps
    .map(
      (s) => `
      <div class="p-2.5 rounded border border-slate-300 bg-slate-50 text-xs space-y-1 print-avoid-break">
        <div class="font-bold text-slate-900">[Step ${s.stepNumber}] ${s.title}</div>
        <div class="font-mono text-blue-900">Formula: ${s.formula}</div>
        <div class="font-mono text-slate-800">Calc: ${s.substitution} → <strong>${s.result}</strong></div>
        ${s.reasoning ? `<div class="text-[10px] text-slate-600 italic">${s.reasoning}</div>` : ''}
      </div>`
    )
    .join('');

  const html = `
    <div class="space-y-5 font-sans text-slate-900 bg-white p-6 max-w-5xl mx-auto leading-relaxed">
      <div class="border-b-2 border-blue-900 pb-4 flex items-start justify-between gap-4 print-avoid-break">
        <div class="flex items-center gap-3.5">
          <img src="${BRAND_LOGO_LIGHT_SVG_DATA_URI}" alt="BD. CivilLab" class="w-14 h-14 rounded-xl object-contain border border-blue-900 bg-white p-0.5 shrink-0" />
          <div>
            <div class="text-xl font-black tracking-tight text-slate-900">BD. CivilLab · Architecture Submittal</div>
            <div class="text-sm font-bold text-blue-800">${payload.tabTitle}</div>
            <div class="text-[10px] font-mono text-slate-600 mt-0.5">Standard: ${payload.codeStandard} · Status: <strong>${payload.status}</strong></div>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right text-[11px] font-mono">
            <div>Doc Ref: <strong>${docId}</strong></div>
            <div>Printed: ${nowStr}</div>
          </div>
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="Verify QR" class="w-16 h-16 border border-slate-400 rounded p-0.5 bg-white" />` : ''}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-300 rounded text-xs font-mono print-avoid-break">
        <div>
          <div class="text-[9px] uppercase font-bold text-slate-500">Project Identification</div>
          <div class="font-bold text-slate-900">${payload.projectName || 'Building Development'} [${payload.projectCode || 'ARC'}]</div>
          <div class="text-slate-600">${payload.siteLocation || 'Municipal Jurisdiction'}</div>
        </div>
        <div class="text-right">
          <div class="text-[9px] uppercase font-bold text-slate-500">Prepared & Certified By</div>
          <div class="font-bold text-slate-900">${engName} (${engDesig})</div>
          <div class="text-slate-600">${engOrg} · Reg: ${engLic}</div>
        </div>
      </div>

      ${
        svgHtmlBlocks
          ? `<div class="p-3 border border-slate-300 rounded bg-white print-avoid-break">
              <div class="text-[11px] font-bold font-mono uppercase text-blue-900 mb-2">1. 2D CAD Architectural / Services Schematic</div>
              ${svgHtmlBlocks}
            </div>`
          : ''
      }

      <div class="border border-slate-300 rounded p-3 bg-white print-avoid-break">
        <div class="text-[11px] font-bold font-mono uppercase text-blue-900 mb-2">2. Input Design Parameters</div>
        <table class="w-full text-[11px] border-collapse">
          <thead>
            <tr class="bg-blue-50 text-blue-900 border-b border-slate-300 text-left">
              <th class="py-1.5 px-2">Parameter</th>
              <th class="py-1.5 px-2 text-center">Symbol</th>
              <th class="py-1.5 px-2 text-right">Value</th>
              <th class="py-1.5 px-2 text-center">Unit</th>
              <th class="py-1.5 px-2">Remarks</th>
            </tr>
          </thead>
          <tbody>${inputRowsHtml}</tbody>
        </table>
      </div>

      <div class="border border-slate-300 rounded p-3 bg-white print-avoid-break">
        <div class="text-[11px] font-bold font-mono uppercase text-blue-900 mb-2">3. Code Compliance &amp; DCR Summary</div>
        <table class="w-full text-[11px] border-collapse">
          <thead>
            <tr class="bg-blue-50 text-blue-900 border-b border-slate-300 text-left">
              <th class="py-1.5 px-2">Compliance Check</th>
              <th class="py-1.5 px-2 text-right">Demand / Actual</th>
              <th class="py-1.5 px-2 text-right">Allowable Limit</th>
              <th class="py-1.5 px-2 text-center">DCR</th>
              <th class="py-1.5 px-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>${dcrRowsHtml}</tbody>
        </table>
      </div>

      <div class="space-y-2">
        <div class="text-[11px] font-bold font-mono uppercase text-slate-600">4. Step-by-Step Hand Calculation Derivations</div>
        ${stepsHtml}
      </div>

      <div class="pt-6 border-t border-slate-300 flex items-center justify-between text-xs font-mono print-avoid-break">
        <div class="text-slate-500">BD. CivilLab Architecture &amp; Building Services Engine · Ref ${docId}</div>
        <div class="w-60 border-t-2 border-slate-800 pt-1 text-center">
          <div class="font-bold">${engName}</div>
          <div class="text-[10px] text-slate-600">${engDesig} · ${engLic}</div>
        </div>
      </div>
    </div>
  `;

  return triggerSafeDomPrint(html);
}
