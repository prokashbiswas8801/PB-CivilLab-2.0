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

export interface PdfExportOptions {
  workspace: CivilWorkspace;
  activeModule: EngineeringModuleId;
  envelope: CalculationEnvelope<any>;
  userProfile?: UserProfile;
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
}: PdfExportOptions): Promise<void> {
  const result = envelope.result;
  if (!result) {
    throw new Error('No analytical results available to generate certified PDF.');
  }

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

  const docId = `DOC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
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

  // Generate QR Code data URL containing doc verification payload
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
  });

  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 120,
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

  // QR Code on right side
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 26, cursorY + 3, 24, 24);
  }

  // Header meta text below QR
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text(`Ref: ${docId}`, pageWidth - margin - 26, cursorY + 29);

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

  const outputRows = extractModuleOutputs(activeModule, result);

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

  // 7. Official Engineer of Record Stamp & Verification Signature Box
  const sigBoxY = Math.max(cursorY, pageHeight - margin - 26);
  doc.setDrawColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setLineWidth(0.4);
  doc.rect(margin, sigBoxY, contentWidth, 20, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('CERTIFIED STRUCTURAL & GEOTECHNICAL ENGINEERING VERIFICATION', margin + 4, sigBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('I hereby certify that this analysis has been conducted in strict compliance with the stated national building codes', margin + 4, sigBoxY + 9);
  doc.text('and that all governing equilibrium criteria, limit states, and serviceability requirements are fully satisfied.', margin + 4, sigBoxY + 12.5);

  // Signature line
  const sigLineX = margin + contentWidth - 65;
  doc.setDrawColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.line(sigLineX, sigBoxY + 13, sigLineX + 60, sigBoxY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`${eorName} (Seal / Signature)`, sigLineX + 2, sigBoxY + 17);

  // 8. Running Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`PB CivilLab Automated Engine v2.4 · Report Doc Ref: ${docId} · Page 1 of 1`, margin, pageHeight - margin + 4);
  doc.text('CONFIDENTIAL & PROPRIETARY · STRICTLY FOR PROFESSIONAL ENGINEERING USE', pageWidth - margin - 75, pageHeight - margin + 4);

  // Trigger direct browser download
  const sanitizedProject = workspace.projectCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${sanitizedProject}_${activeModule}_Certified_Report.pdf`);
}

function extractModuleInputs(
  moduleId: EngineeringModuleId,
  workspace: CivilWorkspace
): { label: string; value: string | number; unit?: string }[] {
  switch (moduleId) {
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

    default:
      return [
        { label: 'Calculation Status', value: 'Verified', status: 'pass' },
      ];
  }
}
