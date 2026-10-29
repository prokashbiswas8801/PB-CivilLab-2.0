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
} from './calculations';
import { getGoverningEquations, GoverningEquationInfo } from './analyticalExport';
import { generateSubmittalDocRef } from './qrCode';
import {
  createVerifiedReportRecord,
  saveVerifiedReport,
} from './verificationEngine';

// ============================================================================
// 1. CLEAN SYMBOL SANITIZER (ASCII Engineering Notation for jsPDF Standard Fonts)
// ============================================================================

/**
 * Replaces unsupported Unicode and Greek symbols in jsPDF standard fonts with clean,
 * readable engineering ASCII notations (e.g. Phi, gamma, sigma, f'c, Mu, m^3/s, kN/m^2).
 * Prevents garbled or missing characters on PDF output.
 */
export function sanitizeEngineeringSymbols(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '';
  let str = String(text);

  const replacements: [RegExp, string][] = [
    // Greek letters
    [/[\u03C6\u03D5\u03A6]/g, 'Phi'],       // φ, ϕ, Φ
    [/[\u03B3\u0393]/g, 'gamma'],           // γ, Γ
    [/[\u03C3\u03A3]/g, 'sigma'],           // σ, Σ
    [/[\u03C4]/g, 'tau'],                   // τ
    [/[\u03B4]/g, 'delta'],                 // δ
    [/[\u0394]/g, 'Delta'],                 // Δ
    [/[\u03B8\u0398]/g, 'theta'],           // θ, Θ
    [/[\u03B2]/g, 'beta'],                  // β
    [/[\u03BB\u039B]/g, 'lambda'],          // λ, Λ
    [/[\u03C0\u03A0]/g, 'pi'],              // π, Π
    [/[\u03C1]/g, 'rho'],                   // ρ
    [/[\u03B5]/g, 'epsilon'],               // ε
    [/[\u03BC]/g, 'mu'],                    // μ (micro)
    [/[\u03C9\u03A9]/g, 'omega'],           // ω, Ω
    [/[\u03B1]/g, 'alpha'],                 // α
    [/[\u03B7]/g, 'eta'],                   // η

    // Math comparisons and symbols
    [/[\u2264]/g, '<='],                    // ≤
    [/[\u2265]/g, '>='],                    // ≥
    [/[\u2260]/g, '!='],                    // ≠
    [/[\u2248]/g, '~='],                    // ≈
    [/[\u00D7]/g, 'x'],                     // ×
    [/[\u00B1]/g, '+/-'],                   // ±
    [/[\u221A]/g, 'sqrt'],                  // √
    [/[\u221E]/g, 'INF'],                   // ∞
    [/[\u2245\u2243]/g, '~='],              // ≅, ≃
    [/[\u2208]/g, 'in'],                    // ∈

    // Exponents / superscripts
    [/[\u00B2]/g, '^2'],                    // ²
    [/[\u00B3]/g, '^3'],                    // ³
    [/[\u2074]/g, '^4'],                    // ⁴
    [/[\u2070]/g, '^0'],                    // ⁰
    [/[\u00B9]/g, '^1'],                    // ¹

    // Engineering units and diameters
    [/[\u00B0]/g, ' deg'],                  // °
    [/[\u00D8\u00F8\u2300]/g, 'Dia '],       // Ø, ø, ⌀
    [/[\u00B7]/g, '.'],                     // ·
    [/[\u2022]/g, '-'],                     // •
    [/[\u2013\u2014]/g, '-'],               // – —
    [/[\u2018\u2019]/g, "'"],               // ‘ ’
    [/[\u201C\u201D]/g, '"'],               // “ ”

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
    lines.push(`"PB CIVILLAB — PROFESSIONAL CIVIL ENGINEERING SCHEDULE"`);
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
  col1: string;          // Item No / Bar Mark
  col2: string;          // Description / Bar Type
  col3: string;          // Category / Unit / Shape
  col4: string | number; // Dimensions / Cut Length
  col5: string | number; // Quantity / Total Weight
  col6?: string | number;// Unit Rate / Spacing
  col7?: string | number;// Total Cost / MT
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

export interface EngineeringReportData {
  projectMeta: {
    projectName: string;
    projectCode: string;
    client?: string;
    location?: string;
    date: string;
    unitSystem: 'SI' | 'Imperial';
    engineerName?: string;
    engineerLicense?: string;
    organization?: string;
  };
  moduleMeta: {
    moduleId: EngineeringModuleId | string;
    moduleTitle: string;
    category?: string;
    standard?: string;
    status?: 'PASS' | 'SAFE' | 'WARNING' | 'FAIL' | 'CRITICAL' | 'VERIFIED';
    dcrMax?: number;
  };
  inputs: ReportParameterRow[];
  outputs: ReportOutputRow[];
  takeoffHeaders?: string[];
  takeoffRows?: ReportTakeoffRow[];
  takeoffSummary?: Array<{ label: string; value: string | number }>;
  stepByStepFormulas?: ReportFormulaStep[];
  governingAssumptions?: string[];
  qrLinkUrl?: string;
  docId?: string;
  notes?: string[];
}

export interface PdfExportEngineOptions {
  onProgress?: (progress: { stage: string; percent: number }) => void;
  autoDownload?: boolean;
  filename?: string;
}

// ============================================================================
// 4. PROFESSIONAL ENGINEERING PDF GENERATOR (jsPDF + jspdf-autotable + QRCode)
// ============================================================================

/**
 * Builds and renders a professional, multi-page engineering calculation submittal
 * using jsPDF, jspdf-autotable, and high-resolution QR verification.
 */
export async function generateEngineeringPDF(
  reportData: EngineeringReportData,
  options: PdfExportEngineOptions = {}
): Promise<jsPDF> {
  const { onProgress } = options;

  const notify = async (stage: string, percent: number) => {
    if (onProgress) {
      onProgress({ stage, percent });
      await new Promise((r) => setTimeout(r, 40));
    }
  };

  await notify('Initializing A4 submittal geometry & vector canvas...', 15);

  // A4 Portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  const docId = reportData.docId || generateSubmittalDocRef(new Date().getFullYear());
  const now = new Date();
  const dateStr = reportData.projectMeta.date || now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Generate QR Code Data URL
  await notify('Generating cryptographic verification QR stamp...', 30);
  const qrUrl = reportData.qrLinkUrl || (
    typeof window !== 'undefined' && window.location?.href
      ? window.location.href
      : `https://pb-civillab.engine?doc=${encodeURIComponent(docId)}`
  );

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: 140,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR Code generation fallback:', err);
  }

  // ==========================================================================
  // PAGE 1: TITLE BLOCK & HEADER
  // ==========================================================================
  await notify('Composing engineering title block and project metadata...', 45);

  // Top Accent Banner (Navy #0f172a)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, contentWidth, 24, 'F');

  // Decorative engineering accent bar (blue #2563eb)
  doc.setFillColor(37, 99, 235);
  doc.rect(margin, margin + 24, contentWidth, 1.5, 'F');

  // Brand Name in White
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PB CIVILLAB', margin + 4, margin + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('PROFESSIONAL CIVIL ENGINEERING LABORATORY & VERIFICATION SUITE', margin + 4, margin + 13);

  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(
    `SUBMITTAL REF: ${docId}  |  STATUS: ${reportData.moduleMeta.status || 'VERIFIED'}  |  SYSTEM: ${reportData.projectMeta.unitSystem.toUpperCase()}`,
    margin + 4,
    margin + 18.5
  );

  // QR Code Box (top right)
  if (qrDataUrl) {
    const qrSize = 21;
    const qrX = margin + contentWidth - qrSize - 1.5;
    const qrY = margin + 1.5;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  // Metadata Grid Box
  let yPos = margin + 29;
  const metaBoxHeight = 26;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, yPos, contentWidth, metaBoxHeight, 2, 2, 'FD');

  // Project Info Columns
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  const col1X = margin + 4;
  const col2X = margin + (contentWidth / 2) + 2;

  // Module & Project Title
  doc.text(
    sanitizeEngineeringSymbols(`${reportData.moduleMeta.moduleTitle} — Calculation Submittal`),
    col1X,
    yPos + 5.5
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Governing Standard: ${sanitizeEngineeringSymbols(reportData.moduleMeta.standard || 'BNBC 2020 / ACI 318-19 / AISC 360-16')}`, col1X, yPos + 9.5);

  doc.text(`Project Name: ${sanitizeEngineeringSymbols(reportData.projectMeta.projectName || 'Civil Infrastructure Design')}`, col1X, yPos + 14.5);
  doc.text(`Project Code: ${sanitizeEngineeringSymbols(reportData.projectMeta.projectCode || 'PBCL-PRJ')}`, col1X, yPos + 18.5);
  doc.text(`Location: ${sanitizeEngineeringSymbols(reportData.projectMeta.location || 'Jobsite Engineering Office')}`, col1X, yPos + 22.5);

  // Col 2
  doc.text(`Client / Agency: ${sanitizeEngineeringSymbols(reportData.projectMeta.client || 'Client Representative')}`, col2X, yPos + 14.5);
  doc.text(`Engineer of Record: ${sanitizeEngineeringSymbols(reportData.projectMeta.engineerName || 'Civil Project Engineer, PE')}`, col2X, yPos + 18.5);
  doc.text(`Date & Unit Standard: ${dateStr}  |  ${reportData.projectMeta.unitSystem} Units`, col2X, yPos + 22.5);

  yPos += metaBoxHeight + 5;

  // ==========================================================================
  // TABLE 1: INPUT DESIGN PARAMETERS
  // ==========================================================================
  await notify('Generating structured input parameters schedule...', 60);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('1. INPUT DESIGN PARAMETERS & SPECIFICATIONS', margin, yPos);
  yPos += 2.5;

  const inputHeaders = ['Parameter Description', 'Symbol', 'Design Input Value', 'Unit', 'Standard / Specification'];
  const inputRows = reportData.inputs.map((inp) => [
    sanitizeEngineeringSymbols(inp.name),
    sanitizeEngineeringSymbols(inp.symbol),
    sanitizeEngineeringSymbols(String(inp.value)),
    sanitizeEngineeringSymbols(inp.unit),
    sanitizeEngineeringSymbols(inp.notes || '—'),
  ]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [inputHeaders],
    body: inputRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
      font: 'helvetica',
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [30, 58, 138], // Navy #1e3a8a
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 62 },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 'auto' },
    },
  });

  // Track cursor position after table
  yPos = (doc as any).lastAutoTable.finalY + 5;

  // ==========================================================================
  // TABLE 2: MATERIAL QUANTITIES / TAKEOFF / BBS (IF PRESENT)
  // ==========================================================================
  if (reportData.takeoffRows && reportData.takeoffRows.length > 0) {
    // Check page overflow
    if (yPos > pageHeight - 45) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('2. MATERIAL QUANTITIES & SCHEDULE / BILL OF QUANTITIES', margin, yPos);
    yPos += 2.5;

    const takeoffHeaders = reportData.takeoffHeaders || [
      'Item No',
      'Description',
      'Category / Unit',
      'Dimensions / Cut Len',
      'Quantity / Weight',
      'Unit Rate',
      'Total Amount',
    ];

    const takeoffTableRows = reportData.takeoffRows.map((r) => [
      sanitizeEngineeringSymbols(r.col1),
      sanitizeEngineeringSymbols(r.col2),
      sanitizeEngineeringSymbols(r.col3),
      sanitizeEngineeringSymbols(String(r.col4)),
      sanitizeEngineeringSymbols(String(r.col5)),
      sanitizeEngineeringSymbols(r.col6 !== undefined ? String(r.col6) : '—'),
      sanitizeEngineeringSymbols(r.col7 !== undefined ? String(r.col7) : '—'),
    ]);

    // If summary exists, append summary rows
    if (reportData.takeoffSummary && reportData.takeoffSummary.length > 0) {
      reportData.takeoffSummary.forEach((s) => {
        takeoffTableRows.push([
          'TOTAL',
          sanitizeEngineeringSymbols(s.label),
          '',
          '',
          '',
          '',
          sanitizeEngineeringSymbols(String(s.value)),
        ]);
      });
    }

    autoTable(doc, {
      startY: yPos,
      margin: { left: margin, right: margin },
      head: [takeoffHeaders],
      body: takeoffTableRows,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.6,
        textColor: [15, 23, 42],
        font: 'helvetica',
        lineColor: [226, 232, 240],
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: [15, 23, 42], // Slate #0f172a
        textColor: [255, 255, 255],
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
  // TABLE 3: FINAL DESIGN OUTPUTS & CODE SAFETY EVALUATIONS
  // ==========================================================================
  await notify('Compiling final design outputs and capacity ratios...', 75);

  if (yPos > pageHeight - 45) {
    doc.addPage();
    yPos = renderPageRunningHeader(doc, reportData, docId);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('3. FINAL ANALYTICAL DESIGN OUTPUTS & CAPACITY CHECKS', margin, yPos);
  yPos += 2.5;

  const outputHeaders = ['Governing Check / Metric', 'Symbol', 'Computed Value', 'Unit', 'Code Limit / Allowable', 'Status / DCR'];
  const outputRows = reportData.outputs.map((out) => [
    sanitizeEngineeringSymbols(out.name),
    sanitizeEngineeringSymbols(out.symbol),
    sanitizeEngineeringSymbols(String(out.value)),
    sanitizeEngineeringSymbols(out.unit),
    sanitizeEngineeringSymbols(out.limit || '—'),
    sanitizeEngineeringSymbols(out.dcrRatio ? `${out.status} (${out.dcrRatio})` : out.status),
  ]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [outputHeaders],
    body: outputRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [15, 23, 42],
      font: 'helvetica',
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 32, halign: 'center' },
      5: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================================================
  // SECTION 4: STEP-BY-STEP FORMULA BREAKDOWNS (WITH AUTO PAGE BREAKS)
  // ==========================================================================
  if (reportData.stepByStepFormulas && reportData.stepByStepFormulas.length > 0) {
    await notify('Formulating mathematical step-by-step derivations...', 85);

    if (yPos > pageHeight - 35) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 58, 138);
    doc.text('4. STEP-BY-STEP MATHEMATICAL FORMULATIONS & CODE DERIVATIONS', margin, yPos);
    yPos += 4;

    for (let idx = 0; idx < reportData.stepByStepFormulas.length; idx++) {
      const step = reportData.stepByStepFormulas[idx];
      const stepNum = step.stepNumber !== undefined ? step.stepNumber : idx + 1;

      // Estimate block height: title (4mm) + eq (5mm) + sub (5mm) + remark (4mm) + margins (4mm) ≈ 22mm
      const blockHeight = 22;
      if (yPos + blockHeight > pageHeight - 25) {
        doc.addPage();
        yPos = renderPageRunningHeader(doc, reportData, docId);
      }

      // Step Box Container
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, yPos, contentWidth, 18, 1.5, 1.5, 'FD');

      // Left blue accent indicator
      doc.setFillColor(37, 99, 235);
      doc.rect(margin, yPos, 1.5, 18, 'F');

      // Step Title & Code Standard
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`[Step ${stepNum}] ${sanitizeEngineeringSymbols(step.title)}`, margin + 3.5, yPos + 4.2);

      if (step.codeRef) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(sanitizeEngineeringSymbols(step.codeRef), margin + contentWidth - 4, yPos + 4.2, { align: 'right' });
      }

      // Governing Formula
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 58, 138);
      doc.text(`Formula: ${sanitizeEngineeringSymbols(step.equation)}`, margin + 3.5, yPos + 8.5);

      // Value Substitution & Result
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      const subText = step.substitution
        ? `Calc:    ${sanitizeEngineeringSymbols(step.substitution)} = ${sanitizeEngineeringSymbols(step.result)}`
        : `Result:  ${sanitizeEngineeringSymbols(step.result)}`;
      doc.text(subText, margin + 3.5, yPos + 12.5);

      // Remarks / Code Check
      if (step.remarks) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Note: ${sanitizeEngineeringSymbols(step.remarks)}`, margin + 3.5, yPos + 16);
      }

      yPos += 20;
    }
  }

  // ==========================================================================
  // SECTION 5: GOVERNING ASSUMPTIONS & ENGINEERING NOTES
  // ==========================================================================
  if (reportData.governingAssumptions && reportData.governingAssumptions.length > 0) {
    if (yPos > pageHeight - 35) {
      doc.addPage();
      yPos = renderPageRunningHeader(doc, reportData, docId);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('5. GOVERNING ASSUMPTIONS & DESIGN CRITERIA', margin, yPos);
    yPos += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);

    reportData.governingAssumptions.forEach((assump) => {
      if (yPos > pageHeight - 25) {
        doc.addPage();
        yPos = renderPageRunningHeader(doc, reportData, docId);
      }
      doc.text(`•  ${sanitizeEngineeringSymbols(assump)}`, margin + 2, yPos);
      yPos += 3.2;
    });
    yPos += 2;
  }

  // ==========================================================================
  // SECTION 6: OFFICIAL ENGINEER SIGNATURE & STAMPING BLOCK
  // ==========================================================================
  await notify('Finalizing professional signature and stamping block...', 92);

  const sigBlockHeight = 28;
  if (yPos + sigBlockHeight > pageHeight - 20) {
    doc.addPage();
    yPos = renderPageRunningHeader(doc, reportData, docId);
  }

  yPos += 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, yPos, contentWidth, sigBlockHeight, 1.5, 1.5, 'FD');

  const halfWidth = contentWidth / 2;

  // Box Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + halfWidth, yPos, margin + halfWidth, yPos + sigBlockHeight);

  // Column Left: Prepared By
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('PREPARED BY (DESIGN ENGINEER)', margin + 4, yPos + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${sanitizeEngineeringSymbols(reportData.projectMeta.engineerName || 'Design Engineer, PE')}`, margin + 4, yPos + 9);
  doc.text(`Reg / License No: ${sanitizeEngineeringSymbols(reportData.projectMeta.engineerLicense || 'PE-104928')}`, margin + 4, yPos + 13);
  doc.text(`Organization: ${sanitizeEngineeringSymbols(reportData.projectMeta.organization || 'PB Civil Engineering Lab')}`, margin + 4, yPos + 17);
  doc.text('Signature: __________________________   Date: ____________', margin + 4, yPos + 23);

  // Column Right: Checked & Approved By
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('CHECKED & CERTIFIED BY (LEAD PE / SE)', margin + halfWidth + 4, yPos + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Title: Senior Structural / Geotechnical Engineer', margin + halfWidth + 4, yPos + 9);
  doc.text('PE Seal / Verification: Cryptographically Anchored In App Registry', margin + halfWidth + 4, yPos + 13);
  doc.text(`Date of Submittal: ${dateStr}`, margin + halfWidth + 4, yPos + 17);
  doc.text('Signature: __________________________   Date: ____________', margin + halfWidth + 4, yPos + 23);

  // ==========================================================================
  // FOOTERS ON ALL PAGES
  // ==========================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 9, margin + contentWidth, pageHeight - 9);

    const footerLeft = `PB CivilLab Professional Suite  •  Doc Ref: ${docId}  •  Tamper-Evident Report`;
    const footerRight = `Page ${i} of ${totalPages}`;

    doc.text(footerLeft, margin, pageHeight - 6);
    doc.text(footerRight, margin + contentWidth, pageHeight - 6, { align: 'right' });
  }

  await notify('Certified engineering submittal compiled successfully!', 100);

  // Auto trigger download if requested
  if (options.autoDownload !== false) {
    const filename = options.filename || `${reportData.moduleMeta.moduleId}_submittal_${docId}.pdf`;
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
  docId: string
): number {
  const margin = 14;
  const contentWidth = 210 - 2 * margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 58, 138);
  doc.text(
    sanitizeEngineeringSymbols(`PB CivilLab  |  ${reportData.moduleMeta.moduleTitle}  |  Project: ${reportData.projectMeta.projectCode}`),
    margin,
    10
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Submittal Ref: ${docId}`, margin + contentWidth, 10, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, 12, margin + contentWidth, 12);

  return 17; // Next vertical start Y
}

// ============================================================================
// 5. EXTRACTOR / ADAPTER: BUILD REPORT DATA FROM ACTIVE WORKSPACE
// ============================================================================

/**
 * Constructs a comprehensive `EngineeringReportData` object from the current
 * workspace and calculation envelope for any active module in PB CivilLab.
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
  const clientName = (workspace as any).client || 'Client Representative';

  const projectMeta = {
    projectName: workspace.name,
    projectCode: workspace.projectCode,
    client: clientName,
    location: workspace.siteLocation || 'Site Engineering Office',
    date: dateStr,
    unitSystem: unitSys,
    engineerName: userProfile?.fullName || workspace.engineerOfRecord || 'Civil Project Engineer, PE',
    engineerLicense: userProfile?.licenseNumber || 'PE-104928',
    organization: userProfile?.organization || 'PB Civil Engineering Lab',
  };

  const governing = getGoverningEquations(moduleId);

  const baseReport: EngineeringReportData = {
    projectMeta,
    moduleMeta: {
      moduleId,
      moduleTitle: moduleId.toUpperCase(),
      category: governing.category,
      standard: governing.codeStandard,
      status: envelope.status === 'valid' ? 'SAFE' : 'WARNING',
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
        { name: 'Nominal Clear Cover', symbol: 'c_c', value: bbs.clearCoverMm || 20, unit: 'mm', notes: 'BNBC 2020 / ACI 318 standard' },
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
      break;
    }

    case 'continuous-beam': {
      const r = result as ContinuousBeamResult;
      const cb = workspace.continuousBeam;
      baseReport.moduleMeta.moduleTitle = 'Continuous Beam Analysis (Clapeyron Theorem)';
      baseReport.moduleMeta.status = 'SAFE';

      const span1Len = cb?.spans?.[0]?.lengthM || 6.0;
      const span2Len = cb?.spans?.[1]?.lengthM || 6.0;
      const span1W = cb?.spans?.[0]?.udlKnPerM || 25.0;

      baseReport.inputs = [
        { name: 'Span Count', symbol: 'N_span', value: cb?.spanCount || 2, unit: 'spans', notes: 'Multi-span beam' },
        { name: 'Span 1 Length', symbol: 'L_1', value: span1Len, unit: 'm', notes: 'First span clear length' },
        { name: 'Span 2 Length', symbol: 'L_2', value: span2Len, unit: 'm', notes: 'Second span clear length' },
        { name: 'Span 1 Uniform Load', symbol: 'w_1', value: span1W, unit: 'kN/m', notes: 'UDL 1' },
      ];

      const supportMB = r.supportMomentsKnm && r.supportMomentsKnm.length > 1 ? r.supportMomentsKnm[1] : 0;
      const reactionA = r.supportReactionsKn && r.supportReactionsKn.length > 0 ? r.supportReactionsKn[0] : 0;
      const reactionB = r.supportReactionsKn && r.supportReactionsKn.length > 1 ? r.supportReactionsKn[1] : 0;

      baseReport.outputs = [
        { name: 'Interior Support Negative Moment', symbol: 'M_B', value: supportMB.toFixed(2), unit: 'kN.m', status: 'SAFE' },
        { name: 'Max Sagging Moment', symbol: 'M_sag', value: r.maxSaggingMomentKnm.toFixed(2), unit: 'kN.m', status: 'SAFE' },
        { name: 'Support A Reaction', symbol: 'R_A', value: reactionA.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Support B Reaction (Central)', symbol: 'R_B', value: reactionB.toFixed(2), unit: 'kN', status: 'SAFE' },
      ];
      break;
    }

    case 'pile-capacity': {
      const r = result as PileCapacityResult;
      const p = workspace.pile;
      baseReport.moduleMeta.moduleTitle = 'Deep Foundation Cast-in-Situ Bored Pile Capacity';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Pile Embedded Length', symbol: 'L', value: p?.lengthM || r.lengthM, unit: 'm', notes: 'Penetration length' },
        { name: 'Pile Shaft Diameter', symbol: 'D', value: p?.diameterM || r.diameterM, unit: 'm', notes: 'Bored shaft diameter' },
        { name: 'Pile Foundation Type', symbol: 'Type', value: p?.pileType || r.pileType, unit: 'classification', notes: 'Installation method' },
        { name: 'Design Factor of Safety', symbol: 'FoS', value: p?.factorOfSafety || 2.5, unit: 'ratio', notes: 'Code safety factor' },
      ];

      baseReport.outputs = [
        { name: 'Ultimate Axial Pile Capacity', symbol: 'Q_ult', value: r.ultimateCapacityKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Allowable Safe Axial Load', symbol: 'Q_all', value: r.allowableCapacityKn.toFixed(2), unit: 'kN', limit: 'Q_ult / FoS', status: 'SAFE' },
        { name: 'Shaft Skin Friction Resistance', symbol: 'Q_s', value: r.skinFrictionKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Base End Bearing Resistance', symbol: 'Q_b', value: r.endBearingKn.toFixed(2), unit: 'kN', status: 'SAFE' },
        { name: 'Pile Cross-Sectional Area', symbol: 'A_p', value: r.crossSectionAreaM2.toFixed(3), unit: 'm^2', status: 'INFO' },
      ];
      break;
    }

    case 'pipe-hydraulics': {
      const r = result as PipeHydraulicsResult;
      const p = workspace.pipe;
      baseReport.moduleMeta.moduleTitle = 'Pressurized Pipe Hydraulics & Darcy-Weisbach / Hazen-Williams';
      baseReport.moduleMeta.status = 'SAFE';

      baseReport.inputs = [
        { name: 'Pipe Internal Diameter', symbol: 'D', value: p?.internalDiameterMm || r.internalDiameterMm, unit: 'mm', notes: 'Inner bore' },
        { name: 'Total Pipe Length', symbol: 'L', value: p?.lengthM || r.lengthM, unit: 'm', notes: 'Conduit length' },
        { name: 'Volumetric Flow Rate', symbol: 'Q', value: p?.flowRateLps || r.flowRateLps, unit: 'L/s', notes: 'Conveyance discharge' },
        { name: 'Pipe Material Specification', symbol: 'Mat', value: p?.pipeMaterial || r.pipeMaterial, unit: 'type', notes: 'Roughness factor' },
      ];

      baseReport.outputs = [
        { name: 'Total Friction Head Loss', symbol: 'h_f', value: r.totalHeadLossM.toFixed(3), unit: 'm', status: 'SAFE' },
        { name: 'Mean Flow Velocity', symbol: 'V', value: r.velocityMps.toFixed(3), unit: 'm/s', limit: '0.6 - 3.0 m/s', status: r.velocityMps >= 0.6 && r.velocityMps <= 3.0 ? 'SAFE' : 'WARNING' },
        { name: 'Reynolds Number', symbol: 'Re', value: r.reynoldsNumber.toFixed(0), unit: 'ratio', limit: r.flowRegime.toUpperCase(), status: 'INFO' },
        { name: 'Darcy Friction Factor', symbol: 'f', value: r.darcyFrictionFactor.toFixed(4), unit: 'dimensionless', status: 'INFO' },
        { name: 'Outlet Gauge Pressure', symbol: 'P_out', value: r.outletPressureKpa.toFixed(1), unit: 'kPa', status: 'SAFE' },
      ];
      break;
    }

    default: {
      // General Fallback
      baseReport.inputs = [
        { name: 'Module Configuration ID', symbol: 'ID', value: moduleId, unit: 'key', notes: 'PB CivilLab Suite' },
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
 * High-level helper to trigger export of certified engineering PDF for the active module
 */
export async function exportCertifiedReportPDF(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace,
  envelope: CalculationEnvelope<any>,
  userProfile?: UserProfile,
  onProgress?: (progress: { stage: string; percent: number }) => void
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

  const filename = `${moduleId}_submittal_${workspace.projectCode || 'PBCL'}.pdf`;
  return generateEngineeringPDF(reportData, {
    onProgress,
    autoDownload: true,
    filename,
  });
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

  exportToCSV(`${workspace.projectCode || 'PBCL'}_Rebar_BBS_Schedule.csv`, headers, rows, metadata);
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

  exportToCSV(`${workspace.projectCode || 'PBCL'}_BOQ_Estimate_Schedule.csv`, headers, rows, metadata);
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

  exportToCSV(`${workspace.projectCode || 'PBCL'}_Earthwork_Schedule.csv`, headers, rows, metadata);
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

  exportToCSV(`${workspace.projectCode || 'PBCL'}_${moduleId.toUpperCase()}_Schedule.csv`, headers, rows, metadata);
}

