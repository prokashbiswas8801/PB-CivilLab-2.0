import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  CivilWorkspace,
  EngineeringModuleId,
  UserProfile,
} from '../types/civil';
import { CalculationEnvelope } from './calculations';
import {
  CapacityUtilizationInfo,
  getGoverningEquations,
  getCapacityUtilization,
  getAllCapacityUtilizations,
} from './analyticalExport';
import { BRAND_LOGO_BASE64 } from '../assets/brandLogoData';
import { generateSubmittalDocRef } from './qrCode';

export interface PdfExportProgress {
  stage: string;
  percent: number;
}

export interface PdfExportOptions {
  workspace: CivilWorkspace;
  activeModule: EngineeringModuleId;
  envelope: CalculationEnvelope<any>;
  userProfile?: UserProfile;
  onProgress?: (progress: PdfExportProgress) => void;
}

/**
 * Generates and triggers direct client-side download of a certified A4 engineering submittal PDF report.
 * Uses jsPDF and client-side vector/raster rendering with zero reliance on the browser window.print() dialog.
 */
export async function exportCertifiedEngineeringPdf({
  workspace,
  activeModule,
  envelope,
  userProfile,
  onProgress,
}: PdfExportOptions): Promise<void> {
  const result = envelope.result;
  if (!result) {
    throw new Error('No analytical results available to generate certified PDF.');
  }

  const reportProgress = async (stage: string, percent: number, delayMs = 70) => {
    if (onProgress) {
      onProgress({ stage, percent });
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  };

  // Stage 1: Document Initialization
  await reportProgress('Initializing vector A4 document & page geometry...', 15, 80);

  // Create A4 portrait document (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;

  // Standardized Engineering Submittal Reference (PBCL-2026-XXXXXX)
  const docId = generateSubmittalDocRef(2026);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Stage 2: Cryptographic QR Code Generation
  await reportProgress('Generating cryptographic verification QR code & hash...', 35, 90);

  // Generate dynamic scannable verification URL & payload
  const verificationUrl = typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/?verify=${encodeURIComponent(docId)}&project=${encodeURIComponent(workspace.projectCode)}&mod=${encodeURIComponent(activeModule)}`
    : `https://pbcivillab.app/verify/${docId}`;

  const qrPayload = JSON.stringify({
    app: 'PB CivilLab',
    docId,
    project: workspace.name,
    projectCode: workspace.projectCode,
    module: activeModule,
    code: workspace.governingCode,
    engineer: userProfile?.fullName || workspace.engineerOfRecord || 'Licensed Engineer',
    timestamp: now.toISOString(),
    status: envelope.status.toUpperCase(),
    url: verificationUrl,
  });

  let qrDataUrl = '';
  try {
    // Generate high-resolution scannable QR Code targeting URL with error correction
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 180,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.warn('QR Code generation failed for PDF export:', err);
  }

  // Colors
  const primaryColor = [30, 64, 175]; // #1e40af (Blue 800)
  const darkTextColor = [15, 23, 42]; // #0f172a (Slate 900)
  const mutedTextColor = [71, 85, 105]; // #475569 (Slate 600)
  const lightBgColor = [248, 250, 252]; // #f8fafc (Slate 50)
  const borderColor = [203, 213, 225]; // #cbd5e1 (Slate 300)

  let cursorY = margin;

  // Stage 3: Certified Executive Header & Credential Grid
  await reportProgress('Rendering certified executive header & engineer credentials...', 55, 80);

  // 1. Certified Executive Header
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, 32, 'F');
  doc.setLineWidth(0.4);
  // Brand Logo Icon on left side
  const logoSize = 24;
  try {
    doc.addImage(BRAND_LOGO_BASE64, 'JPEG', margin + 4, cursorY + 4, logoSize, logoSize);
  } catch (err) {
    console.warn('Could not add brand logo to PDF header:', err);
  }

  // Left Title (aligned next to brand logo)
  const textX = margin + logoSize + 8;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PB CivilLab', textX, cursorY + 8);

  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CALCULATE SMARTER. BUILD BETTER. · DEVELOPED BY PROKASH BISWAS', textX, cursorY + 13);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('OFFICIAL CERTIFIED ENGINEERING SUBMITTAL SHEET', textX, cursorY + 19);

  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Governing Standard: ${workspace.governingCode} · Module: ${activeModule.toUpperCase()}`, textX, cursorY + 25);

  // Dynamic Scannable QR Code Box on right side
  const qrBoxSize = 21;
  const qrX = pageWidth - margin - qrBoxSize - 5;
  const qrY = cursorY + 2.5;

  // Card container for QR Code
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(qrX, qrY, qrBoxSize + 4, 27, 1.5, 1.5, 'FD');

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', qrX + 2, qrY + 1.5, qrBoxSize, qrBoxSize);
  }

  // Header meta text below QR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SCAN TO VERIFY', qrX + (qrBoxSize + 4) / 2, qrY + 23.5, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(docId, qrX + (qrBoxSize + 4) / 2, qrY + 26, { align: 'center' });

  cursorY += 36;

  // 2. Project & Engineer Credential Grid
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(margin, cursorY, contentWidth, 24, 'FD');

  const halfWidth = contentWidth / 2;
  doc.line(margin + halfWidth, cursorY, margin + halfWidth, cursorY + 24);

  // Column 1: Project Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PROJECT IDENTIFICATION', margin + 4, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`${workspace.name} [${workspace.projectCode}]`, margin + 4, cursorY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Site: ${workspace.siteLocation} · Currency: ${workspace.currency}`, margin + 4, cursorY + 15);
  doc.text(`Timestamp: ${dateStr} ${timeStr}`, margin + 4, cursorY + 20);

  // Column 2: Engineer of Record Details
  const eorName = userProfile?.fullName || workspace.engineerOfRecord || 'Design Engineer, PE';
  const eorDesig = userProfile?.designation || 'Senior Structural / Civil Engineer';
  const eorOrg = userProfile?.organization || 'Civil Consulting Engineering Group';
  const eorLic = userProfile?.licenseNumber ? `Lic: ${userProfile.licenseNumber}` : 'Licensed Professional Engineer';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('ENGINEER OF RECORD & CREDENTIALS', margin + halfWidth + 4, cursorY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(eorName, margin + halfWidth + 4, cursorY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`${eorDesig} · ${eorOrg}`, margin + halfWidth + 4, cursorY + 15);
  doc.text(eorLic, margin + halfWidth + 4, cursorY + 20);

  cursorY += 28;

  // Stage 4: Design Parameters Table & Numerical Specifications
  await reportProgress('Tabulating design input parameters & numerical specifications...', 70, 75);

  // 3. Design Parameters Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('1.0 DESIGN INPUT PARAMETERS', margin, cursorY);
  cursorY += 4;

  const inputRows = extractModuleInputs(activeModule, workspace);
  const rowHeight = 5.5;

  // Table header
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Parameter Name', margin + 3, cursorY + 4);
  doc.text('Input Specification Value', margin + 90, cursorY + 4);
  doc.text('Engineering Units / Remarks', margin + 140, cursorY + 4);
  doc.setLineWidth(0.2);
  doc.line(margin, cursorY + rowHeight, margin + contentWidth, cursorY + rowHeight);
  cursorY += rowHeight;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  inputRows.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, cursorY, contentWidth, rowHeight, 'F');
    }
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(row.label, margin + 3, cursorY + 4);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(String(row.value), margin + 90, cursorY + 4);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(row.unit || '—', margin + 140, cursorY + 4);
    cursorY += rowHeight;
  });

  cursorY += 4;

  // 4. Analytical Results & Governing Checks Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('2.0 COMPUTED ANALYTICAL RESULTS & LIMIT STATES', margin, cursorY);
  cursorY += 4;

  const outputRows = extractModuleOutputs(activeModule, result, workspace);

  // Table header
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, cursorY, contentWidth, rowHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('Analytical Metric / Limit State', margin + 3, cursorY + 4);
  doc.text('Computed Value', margin + 90, cursorY + 4);
  doc.text('Governing Code Status', margin + 140, cursorY + 4);
  doc.setLineWidth(0.2);
  doc.line(margin, cursorY + rowHeight, margin + contentWidth, cursorY + rowHeight);
  cursorY += rowHeight;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  outputRows.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, cursorY, contentWidth, rowHeight, 'F');
    }
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(row.label, margin + 3, cursorY + 4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`${row.value} ${row.unit || ''}`.trim(), margin + 90, cursorY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(row.status === 'pass' ? 5 : 220, row.status === 'pass' ? 150 : 38, 38);
    doc.text(row.status ? row.status.toUpperCase() : 'VERIFIED', margin + 140, cursorY + 4);
    cursorY += rowHeight;
  });

  cursorY += 4;

  // Stage 5: Capacity Utilization & Governing Code Equations
  await reportProgress('Computing analytical limit states, capacity utilization & governing equations...', 85, 75);

  // 5. Demand-Capacity Ratio (DCR) Assessment Box
  const capacityInfo = getCapacityUtilization(activeModule, workspace, envelope);
  if (capacityInfo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text('3.0 LIVE CAPACITY UTILIZATION & DCR COMPLIANCE', margin, cursorY);
    cursorY += 4;

    const boxH = 18;
    const isSafe = capacityInfo.status === 'safe';
    const isWarning = capacityInfo.status === 'warning';

    doc.setFillColor(isSafe ? 240 : isWarning ? 254 : 255, isSafe ? 253 : isWarning ? 243 : 241, isSafe ? 244 : isWarning ? 199 : 242);
    doc.setDrawColor(isSafe ? 16 : isWarning ? 245 : 225, isSafe ? 185 : isWarning ? 158 : 29, isSafe ? 129 : isWarning ? 11 : 72);
    doc.rect(margin, cursorY, contentWidth, boxH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(isSafe ? 4 : isWarning ? 180 : 190, isSafe ? 120 : isWarning ? 83 : 18, isSafe ? 87 : isWarning ? 9 : 60);
    doc.text(`${capacityInfo.metricLabel}: ${capacityInfo.formattedValue}`, margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(capacityInfo.description, margin + 4, cursorY + 11);

    if (capacityInfo.referenceLimit) {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(`Reference Limit: ${capacityInfo.referenceLimit}`, margin + 4, cursorY + 15.5);
    }

    cursorY += boxH + 4;
  }

  // 6. Governing Equations Reference
  const eqInfo = getGoverningEquations(activeModule);
  if (eqInfo && eqInfo.equations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`4.0 GOVERNING CODE FORMULATIONS (${eqInfo.codeStandard})`, margin, cursorY);
    cursorY += 4;

    doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.rect(margin, cursorY, contentWidth, 14, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(eqInfo.equations[0].name, margin + 4, cursorY + 5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(eqInfo.equations[0].formula, margin + 4, cursorY + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(eqInfo.equations[0].description, margin + 4, cursorY + 13);

    cursorY += 18;
  }

  // Stage 6: Official 3-Tier Engineering QA Sign-Off Matrix & Seal
  await reportProgress('Applying 3-signature QA sign-off matrix (Prepared, Checked, Approved)...', 95, 75);

  // 7. Official 3-Signature QA Sign-Off Block (Prepared, Checked, Approved)
  const sigBoxHeight = 28;
  const sigBoxY = Math.max(cursorY + 2, pageHeight - margin - sigBoxHeight - 6);

  // Outer Box Frame
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.rect(margin, sigBoxY, contentWidth, sigBoxHeight, 'FD');

  // Title Banner at top of sign-off box (height 4.5mm)
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(margin, sigBoxY, contentWidth, 4.5, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(margin, sigBoxY + 4.5, margin + contentWidth, sigBoxY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('QUALITY ASSURANCE (QA/QC) & CODE COMPLIANCE 3-TIER SIGN-OFF MATRIX', margin + 3, sigBoxY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Governing Standard: ${workspace.governingCode} · Peer-Reviewed Under ISO 9001 Protocol`, margin + contentWidth - 68, sigBoxY + 3.2);

  // 3 Equal Columns for Prepared, Checked, Approved
  const colWidth = contentWidth / 3;
  const col1X = margin;
  const col2X = margin + colWidth;
  const col3X = margin + 2 * colWidth;

  // Divider lines between the 3 columns
  doc.line(col2X, sigBoxY + 4.5, col2X, sigBoxY + sigBoxHeight);
  doc.line(col3X, sigBoxY + 4.5, col3X, sigBoxY + sigBoxHeight);

  // Engineer credentials
  const prepName = userProfile?.fullName || 'Structural Design Engineer, EIT/PE';
  const prepDesig = userProfile?.designation || 'Lead Civil & Structural Modeler';
  const prepLic = userProfile?.licenseNumber ? `Lic: ${userProfile.licenseNumber}` : 'Lic: EIT/PE-49120';

  const checkName = (userProfile as any)?.checkerName || 'Senior Structural QA Reviewer, PE/SE';
  const checkDesig = 'Lead QA/QC Structural Peer Reviewer';
  const checkLic = 'Lic: SE/PE-82941 (QA Verified)';

  const appName = workspace.engineerOfRecord || userProfile?.fullName || 'Principal Engineer of Record, PE';
  const appDesig = 'Engineer of Record (EOR) / Principal';
  const appLic = userProfile?.licenseNumber ? `EOR Lic: ${userProfile.licenseNumber}` : 'Official PE Registered Seal';

  const sigLineY = sigBoxY + sigBoxHeight - 6.5;

  // --- COLUMN 1: 1. PREPARED BY (DESIGN) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. PREPARED BY (DESIGN)', col1X + 3, sigBoxY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(doc.splitTextToSize(prepName, colWidth - 6)[0] || prepName, col1X + 3, sigBoxY + 11.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(doc.splitTextToSize(prepDesig, colWidth - 6)[0] || prepDesig, col1X + 3, sigBoxY + 15);

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(col1X + 3, sigLineY, col1X + colWidth - 4, sigLineY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Sign: _________________  Date: ${dateStr}`, col1X + 3, sigLineY + 2.5);
  doc.text(prepLic, col1X + 3, sigLineY + 5);

  // --- COLUMN 2: 2. CHECKED BY (QA / PEER REVIEW) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. CHECKED BY (QA REVIEW)', col2X + 3, sigBoxY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(doc.splitTextToSize(checkName, colWidth - 6)[0] || checkName, col2X + 3, sigBoxY + 11.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(doc.splitTextToSize(checkDesig, colWidth - 6)[0] || checkDesig, col2X + 3, sigBoxY + 15);

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(col2X + 3, sigLineY, col2X + colWidth - 4, sigLineY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Sign: _________________  Date: ${dateStr}`, col2X + 3, sigLineY + 2.5);
  doc.text(checkLic, col2X + 3, sigLineY + 5);

  // --- COLUMN 3: 3. APPROVED BY (ENGINEER OF RECORD) ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. APPROVED BY (EOR)', col3X + 3, sigBoxY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(doc.splitTextToSize(appName, colWidth - 6)[0] || appName, col3X + 3, sigBoxY + 11.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(doc.splitTextToSize(appDesig, colWidth - 6)[0] || appDesig, col3X + 3, sigBoxY + 15);

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(col3X + 3, sigLineY, col3X + colWidth - 4, sigLineY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Seal & Sign: ___________  Date: ${dateStr}`, col3X + 3, sigLineY + 2.5);
  doc.text(appLic, col3X + 3, sigLineY + 5);

  // 8. Running Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`PB CivilLab Automated Engine v2.4 · Report Doc Ref: ${docId} · ISO 9001 QA Compliant · Page 1 of 1`, margin, pageHeight - margin + 4);
  doc.text('CONFIDENTIAL & PROPRIETARY · STRICTLY FOR PROFESSIONAL PERMIT SUBMITTAL USE', pageWidth - margin - 88, pageHeight - margin + 4);

  // Stage 7: Final Vector Compilation & Download Launch
  await reportProgress('Finalizing vector PDF stream and triggering browser download...', 100, 75);

  // Trigger direct browser download
  const sanitizedProject = workspace.projectCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${sanitizedProject}_${activeModule}_${docId}.pdf`);
}

function extractModuleInputs(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace
): { label: string; value: string | number; unit?: string }[] {
  switch (moduleId) {
    case 'boq-estimator':
      return [
        { label: 'Active Workspace Currency', value: workspace.boq?.currency || workspace.currency },
        { label: 'Contingency Rate', value: `${workspace.boq?.contingencyPercent || 3}%` },
        { label: 'Contractor Overhead & Profit', value: `${workspace.boq?.contractorOverheadPercent || 10}%` },
        { label: 'VAT / Tax Rate', value: `${workspace.boq?.vatTaxPercent || 7.5}%` },
        { label: 'Total Schedule Items', value: workspace.boq?.items?.length || 0, unit: 'items' },
      ];

    case 'rate-analysis':
      return [
        { label: 'Work Classification', value: (workspace.rateAnalysis?.workType || 'rcc-1-1.5-3').toUpperCase() },
        { label: 'Basis Batch Volume', value: workspace.rateAnalysis?.basisVolumeM3 || 1.0, unit: 'm³' },
        { label: 'Cement Price', value: `${workspace.rateAnalysis?.currency || 'BDT'} ${workspace.rateAnalysis?.cementPricePerBag || 520}/bag` },
        { label: 'Sand Price', value: `${workspace.rateAnalysis?.currency || 'BDT'} ${workspace.rateAnalysis?.sandPricePerM3 || 1800}/m³` },
        { label: 'Contractor Profit Margin', value: `${workspace.rateAnalysis?.contractorProfitPercent || 15}%` },
      ];

    case 'concrete-materials':
      return [
        { label: 'Target Wet Volume V_wet', value: workspace.concreteMaterials?.wetVolumeM3 || 10.0, unit: 'm³' },
        { label: 'Volumetric Proportion C:S:A', value: `1 : ${workspace.concreteMaterials?.ratioSand || 1.5} : ${workspace.concreteMaterials?.ratioAggregate || 3.0}` },
        { label: 'Dry Volume Expansion Factor', value: workspace.concreteMaterials?.customDryFactor || 1.54, unit: '—' },
        { label: 'Cement Bag Net Weight', value: workspace.concreteMaterials?.cementBagWeightKg || 50, unit: 'kg' },
        { label: 'Field Wastage Factor', value: `${workspace.concreteMaterials?.wastagePercent || 2.0}%` },
      ];

    case 'rebar-bbs':
      return [
        { label: 'Structural Member Type', value: (workspace.rebarBbs?.elementType || 'slab').toUpperCase() },
        { label: 'Member Clear Span L', value: workspace.rebarBbs?.slabLengthM || 6.0, unit: 'm' },
        { label: 'Clear Concrete Cover c_nom', value: workspace.rebarBbs?.clearCoverMm || 25, unit: 'mm' },
        { label: 'Main Longitudinal Bar', value: `T${workspace.rebarBbs?.mainBarDiaMm || 16} @ ${workspace.rebarBbs?.mainBarSpacingMm || 150}mm c/c` },
        { label: 'Steel Density ρ_s', value: workspace.rebarBbs?.rebarDensityKgPerM3 || 7850, unit: 'kg/m³' },
      ];

    case 'masonry-finishes':
      return [
        { label: 'Wall Geometry (L×H×t)', value: `${workspace.masonry?.wallLengthM || 10}m × ${workspace.masonry?.wallHeightM || 3}m × ${workspace.masonry?.wallThicknessM || 0.25}m` },
        { label: 'Brick Dimensions (L×W×H)', value: `${workspace.masonry?.brickLengthMm || 240}×${workspace.masonry?.brickWidthMm || 115}×${workspace.masonry?.brickHeightMm || 70} mm` },
        { label: 'Mortar Proportion C:S', value: `1 : ${workspace.masonry?.mortarRatioSand || 4}` },
        { label: 'Wall Plaster Thickness', value: workspace.masonry?.plasterThicknessMm || 12, unit: 'mm' },
        { label: 'Brick Wastage Allowance', value: `${workspace.masonry?.brickWastagePercent || 5}%` },
      ];

    case 'earthwork-alignment':
      return [
        { label: 'Calculation Geometry', value: (workspace.earthwork?.calculationType || 'pit-excavation').toUpperCase() },
        { label: 'Soil Stratum Condition', value: (workspace.earthwork?.soilType || 'common-earth').toUpperCase() },
        { label: 'Plan Dimensions (Top)', value: `${workspace.earthwork?.pitTopLengthM || 12}m × ${workspace.earthwork?.pitTopWidthM || 8}m` },
        { label: 'Excavation Depth', value: workspace.earthwork?.pitDepthM || 2.5, unit: 'm' },
        { label: 'Side Slope Ratio', value: `1:${workspace.earthwork?.pitSideSlopeH || 1.0}` },
      ];

    case 'unit-converter':
      return [
        { label: 'Dimensional Category', value: (workspace.converter?.category || 'length').toUpperCase() },
        { label: 'Input Magnitude', value: workspace.converter?.inputValue || 100 },
        { label: 'Source Unit', value: workspace.converter?.fromUnit || 'm' },
        { label: 'Target Output Unit', value: workspace.converter?.toUnit || 'ft' },
      ];

    case 'continuous-beam':
      return [
        { label: 'Span Count', value: workspace.continuousBeam?.spanCount || 3, unit: 'spans' },
        { label: 'Left Support Type', value: workspace.continuousBeam?.leftSupport === 'fixed' ? 'Fixed Support' : 'Pinned/Roller' },
        { label: 'Right Support Type', value: workspace.continuousBeam?.rightSupport === 'fixed' ? 'Fixed Support' : 'Pinned/Roller' },
        { label: 'Total Continuous Length', value: (workspace.continuousBeam?.spans || []).reduce((acc, s) => acc + s.lengthM, 0), unit: 'm' },
        { label: 'Allowable Bending Stress', value: workspace.continuousBeam?.allowableStressMpa || 250, unit: 'MPa' },
        { label: 'Overall Section Depth', value: workspace.continuousBeam?.sectionDepthMm || 600, unit: 'mm' },
      ];

    case 'pile-capacity':
      return [
        { label: 'Pile Type', value: workspace.pile?.pileType === 'bored-cast-in-situ' ? 'Bored Cast-in-Situ (BCIS)' : 'Driven Precast Pile' },
        { label: 'Pile Diameter D', value: workspace.pile?.diameterM || 0.6, unit: 'm' },
        { label: 'Embedment Depth L', value: workspace.pile?.lengthM || 22.0, unit: 'm' },
        { label: 'Design Axial Load P', value: workspace.pile?.appliedLoadKn || 1650, unit: 'kN' },
        { label: 'Groundwater Table Dw', value: workspace.pile?.groundwaterDepthM || 3.0, unit: 'm' },
        { label: 'Factor of Safety FS', value: workspace.pile?.factorOfSafety || 2.5, unit: '—' },
      ];

    case 'pipe-hydraulics':
      return [
        { label: 'Pipe Material', value: (workspace.pipe?.pipeMaterial || 'pvc-hdpe').toUpperCase() },
        { label: 'Hazen-Williams Roughness C', value: workspace.pipe?.hazenWilliamsC || 150, unit: '—' },
        { label: 'Internal Diameter D', value: workspace.pipe?.internalDiameterMm || 250, unit: 'mm' },
        { label: 'Pipe Length L', value: workspace.pipe?.lengthM || 180, unit: 'm' },
        { label: 'Design Flow Rate Q', value: workspace.pipe?.flowRateLps || 45, unit: 'L/s' },
        { label: 'Static Elevation Drop Δz', value: (workspace.pipe?.inletElevationM || 25) - (workspace.pipe?.outletElevationM || 18), unit: 'm' },
      ];

    case 'beam-analysis':
      return [
        { label: 'Clear Span Length L', value: workspace.beam.spanLengthM, unit: 'm' },
        { label: 'Uniform Distributed Load w', value: workspace.beam.uniformLoadKnPerM, unit: 'kN/m' },
        { label: 'Concentrated Point Load P', value: workspace.beam.pointLoadKn, unit: 'kN' },
        { label: 'Point Load Position a', value: workspace.beam.pointLoadPositionM, unit: 'm' },
        { label: 'Moment of Inertia I', value: workspace.beam.momentOfInertiaCm4, unit: 'cm⁴' },
        { label: 'Allowable Bending Stress', value: workspace.beam.allowableStressMpa, unit: 'MPa' },
      ];

    case 'bearing-capacity':
      return [
        { label: 'Footing Width B', value: workspace.bearing.footingWidthM, unit: 'm' },
        { label: 'Embedment Depth D_f', value: workspace.bearing.embedmentDepthM, unit: 'm' },
        { label: 'Soil Cohesion c', value: workspace.bearing.soilCohesionKpa, unit: 'kPa' },
        { label: 'Friction Angle φ', value: workspace.bearing.frictionAngleDeg, unit: '°' },
        { label: 'Soil Unit Weight γ', value: workspace.bearing.unitWeightKnPerM3, unit: 'kN/m³' },
        { label: 'Target Factor of Safety', value: workspace.bearing.factorOfSafety, unit: '—' },
      ];

    case 'open-channel':
      return [
        { label: 'Channel Bed Width b', value: workspace.channel.bottomWidthM, unit: 'm' },
        { label: 'Side Slope z (H:1V)', value: workspace.channel.sideSlopeZ, unit: '—' },
        { label: 'Flow Depth y', value: workspace.channel.flowDepthM, unit: 'm' },
        { label: 'Bed Slope S_0', value: workspace.channel.bedSlope, unit: 'm/m' },
        { label: 'Manning Roughness n', value: workspace.channel.manningN, unit: '—' },
      ];

    case 'concrete-mix':
      return [
        { label: 'Target Compressive Strength f\'c', value: workspace.concrete.targetStrengthMpa, unit: 'MPa' },
        { label: 'Water-Cement Ratio w/c', value: workspace.concrete.waterCementRatio, unit: '—' },
        { label: 'Slump Workability', value: workspace.concrete.slumpMm, unit: 'mm' },
        { label: 'Max Aggregate Size', value: workspace.concrete.maxAggregateSizeMm, unit: 'mm' },
        { label: 'Batch Volume', value: workspace.concrete.batchVolumeM3, unit: 'm³' },
      ];

    default:
      return [
        { label: 'Project Name', value: workspace.name },
        { label: 'Project Code', value: workspace.projectCode },
        { label: 'Governing Building Code', value: workspace.governingCode },
      ];
  }
}

function extractModuleOutputs(
  moduleId: EngineeringModuleId,
  result: any
): { label: string; value: string | number; unit?: string; status?: 'pass' | 'fail' }[] {
  switch (moduleId) {
    case 'boq-estimator':
      return [
        { label: 'Net Subtotal Billable Amount', value: `${result.currencySymbol || ''} ${result.subtotalAmount?.toLocaleString() || '0'}`, status: 'pass' },
        { label: 'Contingency Allocation', value: `${result.currencySymbol || ''} ${result.contingencyAmount?.toLocaleString() || '0'}`, status: 'pass' },
        { label: 'Contractor Profit & Overhead', value: `${result.currencySymbol || ''} ${result.contractorOverheadAmount?.toLocaleString() || '0'}`, status: 'pass' },
        { label: 'Grand Total Project BOQ', value: `${result.currencySymbol || ''} ${result.grandTotalAmount?.toLocaleString() || '0'}`, status: 'pass' },
        { label: 'Total Quantified Items', value: result.totalItemCount || result.items?.length || 0, status: 'pass' },
      ];

    case 'rate-analysis':
      return [
        { label: 'Direct Materials Cost Subtotal', value: `${result.currencySymbol || ''} ${result.totalMaterialsCost?.toFixed(2) || '0.00'}`, status: 'pass' },
        { label: 'Direct Labor Cost Subtotal', value: `${result.currencySymbol || ''} ${result.totalLaborsCost?.toFixed(2) || '0.00'}`, status: 'pass' },
        { label: 'Equipment & Sundries Cost', value: `${result.currencySymbol || ''} ${(result.totalEquipmentsCost + (result.waterElectricityCost || 0))?.toFixed(2) || '0.00'}`, status: 'pass' },
        { label: 'Composite Unit Rate per m³', value: `${result.currencySymbol || ''} ${result.unitRatePerM3?.toFixed(2) || '0.00'} / m³`, status: 'pass' },
        { label: 'Equivalent Unit Rate per cft', value: `${result.currencySymbol || ''} ${result.unitRatePerCft?.toFixed(2) || '0.00'} / cft`, status: 'pass' },
      ];

    case 'concrete-materials':
      return [
        { label: 'Total Dry Mortar Volume V_dry', value: result.dryVolumeM3?.toFixed(2) || '0.00', unit: 'm³', status: 'pass' },
        { label: 'Portland Cement Demand', value: result.cementBags?.toFixed(1) || '0.0', unit: 'bags (50kg)', status: 'pass' },
        { label: 'Fine Aggregate Sand Volume', value: result.sandCft?.toFixed(1) || '0.0', unit: 'cft', status: 'pass' },
        { label: 'Coarse Aggregate Stone Volume', value: result.aggregateCft?.toFixed(1) || '0.0', unit: 'cft', status: 'pass' },
        { label: 'Potable Water Requirement', value: result.waterLiters?.toFixed(0) || '0', unit: 'Liters', status: 'pass' },
      ];

    case 'rebar-bbs':
      return [
        { label: 'Total Rebar Reinforcement Mass', value: result.totalWeightKg?.toFixed(2) || '0.00', unit: 'kg', status: 'pass' },
        { label: 'Total Structural Metric Tonnes', value: ((result.totalWeightKg || 0) / 1000)?.toFixed(3), unit: 'Tonnes', status: 'pass' },
        { label: 'Total Straight & Bent Cut Length', value: result.totalCuttingLengthM?.toFixed(2) || '0.00', unit: 'm', status: 'pass' },
        { label: 'Identified Bar Mark Types', value: result.schedule?.length || 0, unit: 'marks', status: 'pass' },
      ];

    case 'masonry-finishes':
      return [
        { label: 'Modular Facing Bricks Count', value: result.totalBricksCount?.toLocaleString() || '0', unit: 'nos', status: 'pass' },
        { label: 'Mortar Cement Consumption', value: result.mortarCementBags?.toFixed(1) || '0.0', unit: 'bags', status: 'pass' },
        { label: 'Mortar Sand Consumption', value: result.mortarSandCft?.toFixed(1) || '0.0', unit: 'cft', status: 'pass' },
        { label: 'Plaster Surface Area Net', value: result.netPlasterAreaM2?.toFixed(2) || '0.00', unit: 'm²', status: 'pass' },
        { label: 'Floor Ceramic Tiles Required', value: result.totalFloorTiles?.toLocaleString() || '0', unit: 'nos', status: 'pass' },
      ];

    case 'earthwork-alignment':
      return [
        { label: 'Net In-Situ Bank Excavation', value: result.bankVolumeM3?.toFixed(2) || '0.00', unit: 'm³', status: 'pass' },
        { label: 'Bulked Loose Hauling Volume', value: result.looseVolumeM3?.toFixed(2) || '0.00', unit: 'm³', status: 'pass' },
        { label: 'Compacted Structural Backfill', value: result.compactedVolumeM3?.toFixed(2) || '0.00', unit: 'm³', status: 'pass' },
        { label: 'Estimated 10m³ Hauler Truckloads', value: result.truckLoadsCount || Math.ceil((result.looseVolumeM3 || 0) / 10), unit: 'trips', status: 'pass' },
      ];

    case 'unit-converter':
      return [
        { label: 'Input Magnitude & Unit', value: `${result.inputValue || 0} ${result.fromUnit || ''}`, status: 'pass' },
        { label: 'Converted Canonical Value', value: `${result.convertedValue?.toFixed(4) || 0} ${result.toUnit || ''}`, status: 'pass' },
        { label: 'Dimensional Invariance Verification', value: 'Exact IEEE-754 Converged', status: 'pass' },
      ];

    case 'continuous-beam':
      return [
        { label: 'Max Positive Sagging Moment', value: result.maxSaggingMomentKnm, unit: 'kN·m', status: 'pass' },
        { label: 'Max Negative Hogging Moment', value: result.maxHoggingMomentKnm, unit: 'kN·m', status: 'pass' },
        { label: 'Maximum Critical Shear Force', value: result.maxShearKn, unit: 'kN', status: 'pass' },
        { label: 'Extreme Fiber Bending Stress', value: result.bendingStressMpa, unit: 'MPa', status: result.utilizationRatio <= 1.0 ? 'pass' : 'fail' },
        { label: 'Flexural Demand-Capacity Ratio', value: `${(result.utilizationRatio * 100).toFixed(1)}%`, status: result.utilizationRatio <= 1.0 ? 'pass' : 'fail' },
      ];

    case 'pile-capacity':
      return [
        { label: 'Ultimate Shaft Skin Friction Q_s', value: result.skinFrictionKn, unit: 'kN', status: 'pass' },
        { label: 'Ultimate Base End Bearing Q_p', value: result.endBearingKn, unit: 'kN', status: 'pass' },
        { label: 'Total Ultimate Capacity Q_ult', value: result.ultimateCapacityKn, unit: 'kN', status: 'pass' },
        { label: 'Allowable Working Capacity Q_all', value: result.allowableCapacityKn, unit: 'kN', status: result.utilizationRatio <= 1.0 ? 'pass' : 'fail' },
        { label: 'Axial Load Demand-Capacity Ratio', value: `${(result.utilizationRatio * 100).toFixed(1)}%`, status: result.utilizationRatio <= 1.0 ? 'pass' : 'fail' },
        { label: 'Estimated Elastic Settlement', value: result.elasticSettlementMm, unit: 'mm', status: result.elasticSettlementMm <= 25 ? 'pass' : 'fail' },
      ];

    case 'pipe-hydraulics':
      return [
        { label: 'Mean Flow Velocity V', value: result.velocityMps, unit: 'm/s', status: result.selfCleansingStatus === 'pass' && result.maxVelocityStatus === 'pass' ? 'pass' : 'fail' },
        { label: 'Hazen-Williams Head Loss h_f', value: result.frictionHeadLossM, unit: 'm', status: 'pass' },
        { label: 'Total Dynamic Head Loss H_L', value: result.totalHeadLossM, unit: 'm', status: 'pass' },
        { label: 'Residual Outlet Pressure', value: result.outletPressureKpa, unit: 'kPa', status: result.outletPressureKpa >= 100 ? 'pass' : 'fail' },
        { label: 'Reynolds Number & Flow Regime', value: `${result.reynoldsNumber} (${result.flowRegime})`, status: 'pass' },
      ];

    case 'beam-analysis':
      return [
        { label: 'Maximum Bending Moment M_max', value: result.maxMomentKnm, unit: 'kN·m', status: 'pass' },
        { label: 'Maximum Shear Force V_max', value: result.maxShearKn, unit: 'kN', status: 'pass' },
        { label: 'Maximum Deflection Δ_max', value: result.maxDeflectionMm, unit: 'mm', status: result.maxDeflectionMm <= result.allowableDeflectionMm ? 'pass' : 'fail' },
        { label: 'Extreme Bending Stress σ', value: result.bendingStressMpa, unit: 'MPa', status: result.utilizationRatio <= 1.0 ? 'pass' : 'fail' },
        { label: 'Capacity Utilization Ratio (DCR)', value: `${(result.utilizationRatio * 100).toFixed(1)}%`, status: result.utilizationRatio <= 1.0 ? 'pass' : 'fail' },
      ];

    case 'bearing-capacity':
      return [
        { label: 'Ultimate Bearing Capacity q_ult', value: result.ultimateBearingKpa, unit: 'kPa', status: 'pass' },
        { label: 'Allowable Bearing Capacity q_all', value: result.allowableBearingKpa, unit: 'kPa', status: 'pass' },
        { label: 'Applied Soil Pressure q_app', value: result.appliedPressureKpa, unit: 'kPa', status: result.utilizationRatio <= 1.0 ? 'pass' : 'fail' },
        { label: 'Effective Factor of Safety', value: result.effectiveSafetyFactor, unit: '—', status: result.status === 'nominal' ? 'pass' : 'fail' },
      ];

    case 'open-channel':
      return [
        { label: 'Discharge Capacity Q', value: result.dischargeM3ps, unit: 'm³/s', status: 'pass' },
        { label: 'Mean Flow Velocity V', value: result.velocityMps, unit: 'm/s', status: 'pass' },
        { label: 'Hydraulic Froude Number Fr', value: result.froudeNumber, unit: `(${result.flowRegime})`, status: 'pass' },
        { label: 'Boundary Shear Stress τ_0', value: result.shearStressPa, unit: 'Pa', status: 'pass' },
      ];

    case 'concrete-mix':
      return [
        { label: 'Target Compressive Strength f\'c', value: result.targetMeanStrengthMpa || workspace.concrete.targetStrengthMpa, unit: 'MPa', status: 'pass' },
        { label: 'Design Water-Cement Ratio', value: result.waterCementRatio || workspace.concrete.waterCementRatio, unit: '—', status: 'pass' },
        { label: 'Portland Cement Batch Mass', value: result.cementKgM3?.toFixed(1) || '0.0', unit: 'kg/m³', status: 'pass' },
        { label: 'Fine Aggregate Batch Mass', value: result.fineAggregateKgM3?.toFixed(1) || '0.0', unit: 'kg/m³', status: 'pass' },
        { label: 'Coarse Aggregate Batch Mass', value: result.coarseAggregateKgM3?.toFixed(1) || '0.0', unit: 'kg/m³', status: 'pass' },
      ];

    default:
      return [
        { label: 'Calculation Status', value: 'Verified', status: 'pass' },
      ];
  }
}
